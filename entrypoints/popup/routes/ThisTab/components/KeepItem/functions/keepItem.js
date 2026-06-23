// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import getKey from '@/partials/sessionStorage/getKey';
import saveItems from '@/entrypoints/background/websocket/utils/saveItems';
import { generateNonce } from '@/partials/functions';
import { ENCRYPTION_KEYS } from '@/constants';

/**
* Function to keep the item.
* @async
* @param {Object} state - The current state.
* @return {Promise<void>} A promise that resolves when the item is kept.
*/
const keepItem = async state => {
  const [items, itemsKeys] = await Promise.all([
    getItems(),
    getItemsKeys(state.deviceId, state.vaultId)
  ]);

  // Update sif (generic)
  const item = items.find(item => item.id === state.itemId);
  const sifs = item.sifs || {};
  const updateSifArr = [];

  // Import the ItemT2 key forwarded by the autofill flow (raw Base64). It was derived and exported
  // background-side; re-deriving it here is impossible because the HKDF session key is
  // non-serializable and never reaches the popup intact (finding #29).
  const encryptionItemT2KeyAES_B64 = state.encryptionItemT2KeyB64;
  let encryptionItemT2Key;

  try {
    encryptionItemT2Key = await crypto.subtle.importKey('raw', Base64ToArrayBuffer(encryptionItemT2KeyAES_B64), { name: 'AES-GCM' }, false, ['encrypt']);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.keepPasswordImportKeyError, { event: e });
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

  logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'Popup - session write - keepItem');

  // Remove items from session storage (by itemsKeys)
  await storage.removeItems(itemsKeys);

  // saveItems
  await saveItems(items, state.deviceId, state.vaultId);

  // Set alarm for reset T2 SIF
  await browser.alarms.create(`sifT2Reset-${state.deviceId}|${state.vaultId}|${state.itemId}`, { delayInMinutes: sifResetTime });
};

export default keepItem;
