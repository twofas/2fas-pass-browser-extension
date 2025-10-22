// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import generateEncryptionAESKey from '@/partials/WebSocket/utils/generateEncryptionAESKey';
import getKey from '@/partials/sessionStorage/getKey';
import compressObject from '@/partials/gzip/compressObject';
import saveItems from '@/partials/WebSocket/utils/saveItems';
import { ENCRYPTION_KEYS } from '@/constants';

/** 
* Function to keep the password.
* @async
* @param {Object} state - The current state.
* @return {Promise<void>} A promise that resolves when the password is kept.
*/
const keepPassword = async state => {
  // @TODO: Change to v2!

  // Get items
  const items = await getItems();

  // Get itemsKeys
  const itemsKeys = await getItemsKeys(state.deviceId);

  // Update password
  const item = items.find(item => item.id === state.itemId);
  item.password = state.password;

  // Compress items
  const itemsGZIP = await compressObject(items);

  // generate encryptionItemT2Key
  const encryptionItemT2Key = await generateEncryptionAESKey(state.hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T2.crypto, state.sessionKeyForHKDF, true);
  let encryptionItemT2KeyAES_B64;

  try {
    const encryptionItemT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT2Key);
    encryptionItemT2KeyAES_B64 = ArrayBufferToBase64(encryptionItemT2KeyAESRaw);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.keepPasswordExportKeyError, { event: e });
  }

  // save encryptionItemT2Key in session storage
  const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: state.deviceId, itemId: state.itemId });
  await storage.setItem(`session:${itemT2Key}`, encryptionItemT2KeyAES_B64);

  // Remove items from session storage (by itemsKeys)
  await storage.removeItems(itemsKeys);

  // saveItems
  // await saveItems(itemsGZIP, state.deviceId);
  
  // Set alarm for reset T2 SIF
  await browser.alarms.create(`sifT2Reset-${state.itemId}|${state.vaultId}`, { delayInMinutes: config.passwordResetDelay }); // @TODO: Check this case
};

export default keepPassword;
