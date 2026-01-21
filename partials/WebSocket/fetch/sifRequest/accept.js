// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';
import getItems from '@/partials/sessionStorage/getItems';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import generateEncryptionAESKey from '@/partials/WebSocket/utils/generateEncryptionAESKey';
import getKey from '@/partials/sessionStorage/getKey';
import saveItems from '@/partials/WebSocket/utils/saveItems';
import { generateNonce, encryptValueForTransmission } from '@/partials/functions';
import { ENCRYPTION_KEYS } from '@/constants';
import Login from '@/models/itemModels/Login';
import PaymentCard from '@/models/itemModels/PaymentCard';

/**
* Decrypts an encrypted SIF value using the T2 encryption key.
* @param {string} encryptedValue - Base64 encoded encrypted value.
* @param {CryptoKey} encryptionItemT2Key - The T2 encryption key.
* @return {Promise<string>} Decrypted string value.
*/
const decryptSifValue = async (encryptedValue, encryptionItemT2Key) => {
  const valueAB = Base64ToArrayBuffer(encryptedValue);
  const valueDecryptedBytes = DecryptBytes(valueAB);

  const decryptedValueAB = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: valueDecryptedBytes.iv },
    encryptionItemT2Key,
    valueDecryptedBytes.data
  );

  return ArrayBufferToString(decryptedValueAB);
};

/**
* Encrypts a value for transmission if crypto is available.
* @param {string} value - The value to encrypt.
* @param {boolean} cryptoAvailable - Whether crypto is available.
* @return {Promise<string|null>} Encrypted value or original value.
*/
const prepareValueForTransmission = async (value, cryptoAvailable) => {
  if (!value || value.length === 0) {
    return null;
  }

  if (cryptoAvailable) {
    const result = await encryptValueForTransmission(value);

    if (result.status === 'ok') {
      return result.data;
    }

    return null;
  }

  return value;
};

/**
* Handles Login autofill after SIF request acceptance.
* @param {Object} info - The info object with decrypted data.
* @param {Object} state - The state object.
* @param {Object} item - The Login item.
* @param {CryptoKey} encryptionItemT2Key - The T2 encryption key.
* @param {string} messageId - The message ID.
* @param {ArrayBuffer} hkdfSaltAB - The HKDF salt as an ArrayBuffer.
* @param {ArrayBuffer} sessionKeyForHKDF - The session key for HKDF as an ArrayBuffer.
* @return {Promise<Object>} Result object.
*/
const handleLoginAutofillAccept = async (info, state, item, encryptionItemT2Key, messageId, hkdfSaltAB, sessionKeyForHKDF) => {
  const password = info.data.s_password;
  let encryptedValueB64 = null;
  const noPassword = !password || password.length === 0;
  const noUsername = !item?.content?.username || item?.content?.username?.length === 0;

  if (!noPassword) {
    const decryptedPassword = await decryptSifValue(password, encryptionItemT2Key);

    encryptedValueB64 = await prepareValueForTransmission(decryptedPassword, state?.data?.cryptoAvailable);
  }

  const actionData = {
    action: REQUEST_ACTIONS.AUTOFILL,
    username: item.content.username,
    password: encryptedValueB64 || '',
    target: REQUEST_TARGETS.CONTENT,
    noPassword,
    noUsername,
    cryptoAvailable: state?.data?.cryptoAvailable
  };

  await sendPullRequestCompleted(messageId);

  if (state?.from === 'shortcut') {
    return { windowClose: true };
  }

  return {
    action: 'autofill',
    actionData,
    deviceId: state.data.deviceId,
    vaultId: state.data.vaultId,
    itemId: state.data.itemId,
    s_password: password,
    hkdfSaltAB,
    sessionKeyForHKDF
  };
};

/**
* Handles PaymentCard autofill after SIF request acceptance.
* @param {Object} info - The info object with decrypted data.
* @param {Object} state - The state object.
* @param {Object} item - The PaymentCard item.
* @param {CryptoKey} encryptionItemT2Key - The T2 encryption key.
* @param {string} messageId - The message ID.
* @param {ArrayBuffer} hkdfSaltAB - The HKDF salt as an ArrayBuffer.
* @param {ArrayBuffer} sessionKeyForHKDF - The session key for HKDF as an ArrayBuffer.
* @return {Promise<Object>} Result object.
*/
const handlePaymentCardAutofillAccept = async (info, state, item, encryptionItemT2Key, messageId, hkdfSaltAB, sessionKeyForHKDF) => {
  const cryptoAvailable = state?.data?.cryptoAvailable;

  let decryptedCardNumber = '';
  let decryptedExpirationDate = '';
  let decryptedSecurityCode = '';

  if (info.data.s_cardNumber && info.data.s_cardNumber.length > 0) {
    decryptedCardNumber = await decryptSifValue(info.data.s_cardNumber, encryptionItemT2Key);
  }

  if (info.data.s_expirationDate && info.data.s_expirationDate.length > 0) {
    decryptedExpirationDate = await decryptSifValue(info.data.s_expirationDate, encryptionItemT2Key);
  }

  if (info.data.s_securityCode && info.data.s_securityCode.length > 0) {
    decryptedSecurityCode = await decryptSifValue(info.data.s_securityCode, encryptionItemT2Key);
  }

  let encryptedCardNumberB64 = null;
  let encryptedExpirationDateB64 = null;
  let encryptedSecurityCodeB64 = null;

  encryptedCardNumberB64 = await prepareValueForTransmission(decryptedCardNumber, cryptoAvailable);
  encryptedExpirationDateB64 = await prepareValueForTransmission(decryptedExpirationDate, cryptoAvailable);
  encryptedSecurityCodeB64 = await prepareValueForTransmission(decryptedSecurityCode, cryptoAvailable);

  decryptedCardNumber = '';
  decryptedExpirationDate = '';
  decryptedSecurityCode = '';

  const actionData = {
    action: REQUEST_ACTIONS.AUTOFILL_CARD,
    cardholderName: item.content.cardHolder,
    cardIssuer: item.content.cardIssuer,
    target: REQUEST_TARGETS.CONTENT,
    cryptoAvailable
  };

  if (encryptedCardNumberB64) {
    actionData.cardNumber = encryptedCardNumberB64;
    actionData.cardNumberEncrypted = true;
  }

  if (encryptedExpirationDateB64) {
    actionData.expirationDate = encryptedExpirationDateB64;
    actionData.expirationDateEncrypted = true;
  }

  if (encryptedSecurityCodeB64) {
    actionData.securityCode = encryptedSecurityCodeB64;
    actionData.securityCodeEncrypted = true;
  }

  encryptedCardNumberB64 = null;
  encryptedExpirationDateB64 = null;
  encryptedSecurityCodeB64 = null;

  await sendPullRequestCompleted(messageId);

  if (state?.from === 'shortcut') {
    return { windowClose: true };
  }

  return {
    action: 'autofillCard',
    actionData,
    deviceId: state.data.deviceId,
    vaultId: state.data.vaultId,
    itemId: state.data.itemId,
    s_cardNumber: info.data.s_cardNumber,
    s_expirationDate: info.data.s_expirationDate,
    s_securityCode: info.data.s_securityCode,
    hkdfSaltAB,
    sessionKeyForHKDF
  };
};

/**
* Handles the acceptance of a sif request.
* @param {Object} info - The info object.
* @param {Object} state - The state object.
* @param {ArrayBuffer} hkdfSaltAB - The HKDF salt as an ArrayBuffer.
* @param {ArrayBuffer} sessionKeyForHKDF - The session key for HKDF as an ArrayBuffer.
* @param {string} messageId - The message ID.
* @return {Promise<Object>} Object containing returnUrl and returnToast or action for autofill.
*/
const sifRequestAccept = async (info, state, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  try {
    // Autofill from handleAutofill or shortcut autofill
    if (state?.from === 'autofill' || state?.from === 'shortcut') {
      const items = await getItems();
      const item = items.find(item => item.id === state.data.itemId);
      const contentType = state.data.contentType;

      const encryptionItemT2Key = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T2.crypto, sessionKeyForHKDF, true);

      if (contentType === Login.contentType) {
        return await handleLoginAutofillAccept(info, state, item, encryptionItemT2Key, messageId, hkdfSaltAB, sessionKeyForHKDF);
      }

      if (contentType === PaymentCard.contentType) {
        return await handlePaymentCardAutofillAccept(info, state, item, encryptionItemT2Key, messageId, hkdfSaltAB, sessionKeyForHKDF);
      }
    }

    const [items, itemsKeys] = await Promise.all([
      getItems(),
      getItemsKeys(state.data.deviceId, state.data.vaultId)
    ]);

    // Update sif (generic)
    const item = items.find(item => item.id === state.data.itemId);
    const sifs = item.sifs || [];
    const updateSifArr = [];

    // generate encryptionItemT2Key
    const encryptionItemT2Key = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T2.crypto, sessionKeyForHKDF, true);
    const encryptionItemT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT2Key);
    const encryptionItemT2KeyAES_B64 = ArrayBufferToBase64(encryptionItemT2KeyAESRaw);

    // save encryptionItemT2Key in session storage (must be done before setSif)
    const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: state.data.deviceId, itemId: state.data.itemId });
    await storage.setItem(`session:${itemT2Key}`, encryptionItemT2KeyAES_B64);

    for (const sifKey of sifs) {
      if (info.data[sifKey] === undefined) {
        const nonce = await generateNonce();
        const encryptedEmpty = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce.ArrayBuffer },
          encryptionItemT2Key,
          StringToArrayBuffer('')
        );
        const encryptedEmptyBytes = EncryptBytes(nonce.ArrayBuffer, encryptedEmpty);
        const encryptedEmptyB64 = ArrayBufferToBase64(encryptedEmptyBytes);

        updateSifArr.push({ [sifKey]: encryptedEmptyB64 });
      } else {
        updateSifArr.push({ [sifKey]: info.data[sifKey] });
      }
    }

    item.setSifEncrypted(updateSifArr);

    // Save sifTime in item's internalData
    const sifResetTime = info.expireInSeconds && info.expireInSeconds > 30 ? info.expireInSeconds / 60 : config.passwordResetDelay;
    item.internalData.sifResetTime = sifResetTime;

    // Remove items from session storage (by itemsKeys)
    await storage.removeItems(itemsKeys);

    // saveItems
    await saveItems(items, state.data.deviceId, state.data.vaultId);

    // Set alarm for reset T2 SIF
    await browser.alarms.create(`sifT2Reset-${state.data.deviceId}|${state.data.vaultId}|${state.data.itemId}`, { delayInMinutes: sifResetTime });

    // Send response
    await sendPullRequestCompleted(messageId);

    const returnUrl = state.from === 'details' ? `/details/${state.data.deviceId}/${state.data.vaultId}/${state.data.itemId}` : '/';

    return {
      returnUrl,
      returnState: { from: 'fetch' },
      returnToast: {
        text: getMessage(`fetch_${item.contentType ?? 'generic'}_request_accept_toast`),
        type: 'success'
      }
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionPasswordRequestAcceptError, { event: e });
  }
};

export default sifRequestAccept;
