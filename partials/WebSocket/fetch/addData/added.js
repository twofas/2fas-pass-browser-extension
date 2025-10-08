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
import compressObject from '@/partials/gzip/compressObject';
import saveItems from '@/partials/WebSocket/utils/saveItems';
import { ENCRYPTION_KEYS } from '@/constants';

/** 
* Handles the addition of a new item.
* @param {Object} data - The data object.
* @param {ArrayBuffer} hkdfSaltAB - The HKDF salt as an ArrayBuffer.
* @param {ArrayBuffer} sessionKeyForHKDF - The session key for HKDF as an ArrayBuffer.
* @param {string} messageId - The message ID.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const newDataAdded = async (data, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  if (!data || !data?.login || !data?.login?.deviceId || !data?.login?.id) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginAddedWrongData);
  }

  try {
    const [items, itemsKeys] = await Promise.all([
      getItems(),
      getItemsKeys(data.login.deviceId)
    ]);

    // Add new data to items
    const newItem = { ...data.login, internalType: 'added' };
    items.push(newItem);

    // Compress items
    const itemsGZIP = await compressObject(items);

    if (data.login.securityType === SECURITY_TIER.SECRET) {
      // generate encryptionItemT3Key
      const encryptionItemT3Key = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T3.crypto, sessionKeyForHKDF, true);
      const encryptionItemT3KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT3Key);
      const encryptionItemT3KeyAES_B64 = ArrayBufferToBase64(encryptionItemT3KeyAESRaw);

      // save encryptionItemT3Key in session storage
      const itemT3Key = await getKey(ENCRYPTION_KEYS.ITEM_T3_NEW.sK, { deviceId: data.login.deviceId, itemId: data.login.id });
      await storage.setItem(`session:${itemT3Key}`, encryptionItemT3KeyAES_B64);
    } else if (data.login.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      // generate encryptionItemT2Key
      const encryptionItemT2Key = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T2.crypto, sessionKeyForHKDF, true);
      const encryptionItemT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT2Key);
      const encryptionItemT2KeyAES_B64 = ArrayBufferToBase64(encryptionItemT2KeyAESRaw);

      // save encryptionItemT2Key in session storage
      const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: data.login.deviceId, itemId: data.login.id });
      await storage.setItem(`session:${itemT2Key}`, encryptionItemT2KeyAES_B64);
    } else {
      throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginAddedWrongSecurityType);
    }

    // Remove items from session storage (by itemsKeys)
    await storage.removeItems(itemsKeys);

    // saveItems
    await saveItems(itemsGZIP, data.login.deviceId);

    // Set alarm for 3 minutes if T2
    if (data.login.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await browser.alarms.create(`passwordT2Reset-${data.login.id}`, { delayInMinutes: config.passwordResetDelay });
    }

    // Send response
    await sendPullRequestCompleted(messageId);

    return {
      returnUrl: '/',
      returnToast: {
        text: browser.i18n.getMessage('fetch_new_login_added_toast'),
        type: 'success'
      }
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginAddedError, { event: e });
  }
};

export default newDataAdded;
