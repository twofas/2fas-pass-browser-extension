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
import compress from '@/partials/gzip/compress';
import saveItems from '@/partials/WebSocket/utils/saveItems';
import { sendMessageToAllFrames, generateNonce } from '@/partials/functions';
import { ENCRYPTION_KEYS } from '@/constants';

// FUTURE - Better error handling

/** 
* Handles the acceptance of a sif request.
* @param {Object} data - The data object.
* @param {Object} state - The state object.
* @param {ArrayBuffer} hkdfSaltAB - The HKDF salt as an ArrayBuffer.
* @param {ArrayBuffer} sessionKeyForHKDF - The session key for HKDF as an ArrayBuffer.
* @param {string} messageId - The message ID.
* @return {Promise<Object>} Object containing returnUrl and returnToast or action for autofill.
*/
const sifRequestAccept = async (data, state, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  try {
    // Autofill from handleAutofill
    if (state?.from === 'autofill') {
      // Get items
      const items = await getItems();

      // Get item (for username only)
      const item = items.find(item => item.id === state.data.itemId);

      // Decrypt password
      const password = data.passwordEnc;
      const tabId = state.data.tabId;
      
      const passwordAB = Base64ToArrayBuffer(password);
      const passwordDecryptedBytes = DecryptBytes(passwordAB);

      const encryptionItemT2Key = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T2.crypto, sessionKeyForHKDF, true);

      const decryptedPasswordAB = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: passwordDecryptedBytes.iv },
        encryptionItemT2Key,
        passwordDecryptedBytes.data
      );
      const decryptedPassword = ArrayBufferToString(decryptedPasswordAB);

      let encryptedValueB64 = null;

      if (state?.data?.cryptoAvailable) {
        const [nonce, localKey] = await Promise.all([
          generateNonce(),
          storage.getItem('local:lKey')
        ]);

        const localKeyCrypto = await crypto.subtle.importKey(
          'raw',
          Base64ToArrayBuffer(localKey),
          { name: 'AES-GCM' },
          false,
          ['encrypt']
        );

        const value = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce.ArrayBuffer },
          localKeyCrypto,
          StringToArrayBuffer(decryptedPassword)
        );

        const encryptedValue = EncryptBytes(nonce.ArrayBuffer, value);
        encryptedValueB64 = ArrayBufferToBase64(encryptedValue);
      } else {
        encryptedValueB64 = decryptedPassword;
      }

      // Send autofill to tab
      const autofillRes = await sendMessageToAllFrames(
        tabId,
        {
          action: REQUEST_ACTIONS.AUTOFILL,
          username: item.username,
          password: encryptedValueB64,
          target: REQUEST_TARGETS.CONTENT,
          cryptoAvailable: state?.data?.cryptoAvailable
        }
      );
      
      // Send response
      await sendPullRequestCompleted(messageId);

      if (state?.from === 'shortcut') {
        return { windowClose: true };
      }
      
      if (state?.from === 'autofill') {
        return {
          action: 'autofill', // non-fetch action here
          autofillRes,
          itemId: state.data.itemId,
          deviceId: state.data.deviceId,
          password: password,
          hkdfSaltAB,
          sessionKeyForHKDF
        };
      }
    }

    const [items, itemsKeys] = await Promise.all([
      getItems(),
      getItemsKeys(state.data.deviceId)
    ]);

    // Update password
    const item = items.find(item => item.id === state.data.itemId);
    item.password = data.passwordEnc;

    // Compress items
    const itemsStringify = JSON.stringify(items);
    const itemsGZIP_AB = await compress(itemsStringify);
    const itemsGZIP = ArrayBufferToBase64(itemsGZIP_AB);

    // generate encryptionItemT2Key
    const encryptionItemT2Key = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T2.crypto, sessionKeyForHKDF, true);
    const encryptionItemT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT2Key);
    const encryptionItemT2KeyAES_B64 = ArrayBufferToBase64(encryptionItemT2KeyAESRaw);

    // save encryptionItemT2Key in session storage
    const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: state.data.deviceId, itemId: state.data.itemId });
    await storage.setItem(`session:${itemT2Key}`, encryptionItemT2KeyAES_B64);

    // Remove items from session storage (by itemsKeys)
    await storage.removeItems(itemsKeys);

    // saveItems
    await saveItems(itemsGZIP, state.data.deviceId);

    // Set alarm for 3 minutes
    await browser.alarms.create(`passwordT2Reset-${state.data.itemId}`, { delayInMinutes: config.passwordResetDelay });

    // Send response
    await sendPullRequestCompleted(messageId);

    return {
      returnUrl: '/',
      returnToast: {
        text: browser.i18n.getMessage('fetch_password_request_accept_toast'),
        type: 'success'
      }
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionPasswordRequestAcceptError, { event: e });
  }
};

export default sifRequestAccept;
