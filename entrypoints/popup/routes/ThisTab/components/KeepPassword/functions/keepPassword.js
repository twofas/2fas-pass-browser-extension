// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import generateEncryptionAESKey from '@/partials/WebSocket/utils/generateEncryptionAESKey';
import getKey from '@/partials/sessionStorage/getKey';
import saveItems from '@/partials/WebSocket/utils/saveItems';
import { generateNonce } from '@/partials/functions';
import { ENCRYPTION_KEYS } from '@/constants';

/**
* Function to keep the password.
* @async
* @param {Object} state - The current state.
* @return {Promise<void>} A promise that resolves when the password is kept.
*/
const keepPassword = async state => {
  const [items, itemsKeys] = await Promise.all([
    getItems(),
    getItemsKeys(state.deviceId, state.vaultId)
  ]);

  // Update sif (generic)
  const item = items.find(item => item.id === state.itemId);
  const sifs = item.sifs || {};
  const updateSifArr = [];

  // generate encryptionItemT2Key
  const encryptionItemT2Key = await generateEncryptionAESKey(state.hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T2.crypto, state.sessionKeyForHKDF, true);
  let encryptionItemT2KeyAES_B64;

  try {
    const encryptionItemT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT2Key);
    encryptionItemT2KeyAES_B64 = ArrayBufferToBase64(encryptionItemT2KeyAESRaw);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.keepPasswordExportKeyError, { event: e });
  }

  for (const sifKey of sifs) {
    if (state[sifKey] === undefined) {
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
      updateSifArr.push({ [sifKey]: state[sifKey] });
    }
  }

  item.setSifEncrypted(updateSifArr);

  // Save sifTime in item's internalData
  const sifResetTime = state.expireInSeconds && state.expireInSeconds > 30 ? state.expireInSeconds / 60 : config.passwordResetDelay;
  item.internalData.sifResetTime = sifResetTime;

  // save encryptionItemT2Key in session storage
  const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: state.deviceId, itemId: state.itemId });
  await storage.setItem(`session:${itemT2Key}`, encryptionItemT2KeyAES_B64);

  // Remove items from session storage (by itemsKeys)
  await storage.removeItems(itemsKeys);

  // saveItems
  await saveItems(items, state.deviceId, state.vaultId);

  // Set alarm for reset T2 SIF
  await browser.alarms.create(`sifT2Reset-${state.deviceId}|${state.vaultId}|${state.itemId}`, { delayInMinutes: sifResetTime });
};

export default keepPassword;
