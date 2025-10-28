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
import saveTags from '@/partials/WebSocket/utils/saveTags';
import { ENCRYPTION_KEYS } from '@/constants';
import matchModel from '@/partials/models/itemModels/matchModel';

/** 
* Handles the addition of a new item.
* @param {Object} data - The data object.
* @param {ArrayBuffer} hkdfSaltAB - The HKDF salt as an ArrayBuffer.
* @param {ArrayBuffer} sessionKeyForHKDF - The session key for HKDF as an ArrayBuffer.
* @param {string} messageId - The message ID.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const newDataAdded = async (info, state, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  if (!info || !info?.data || !info?.data?.content) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginAddedWrongData);
  }

  try {
    const [items, itemsKeys] = await Promise.all([
      getItems(),
      getItemsKeys(state.deviceId, info.data.vaultId)
    ]);

    // Add new data to items
    const newData = Object.assign({}, info.data);
    newData.internalData = newData.internalData || {};
    newData.internalData.type = 'added';

    const sifResetTime = info.expireInSeconds && info.expireInSeconds > 30 ? info.expireInSeconds / 60 : config.passwordResetDelay;

    if (newData.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      newData.internalData.sifResetTime = sifResetTime;
    }

    newData.deviceId = state.deviceId;

    const newItem = matchModel(newData);

    if (!newItem) {
      throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginAddedWrongData);
    }

    items.push(newItem);

    if (info.data.securityType === SECURITY_TIER.SECRET) {
      // generate encryptionItemT3Key
      const encryptionItemT3Key = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T3.crypto, sessionKeyForHKDF, true);
      const encryptionItemT3KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT3Key);
      const encryptionItemT3KeyAES_B64 = ArrayBufferToBase64(encryptionItemT3KeyAESRaw);

      // save encryptionItemT3Key in session storage
      const itemT3Key = await getKey(ENCRYPTION_KEYS.ITEM_T3_NEW.sK, { deviceId: state.deviceId, itemId: info.data.id });
      await storage.setItem(`session:${itemT3Key}`, encryptionItemT3KeyAES_B64);
    } else if (info.data.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      // generate encryptionItemT2Key
      const encryptionItemT2Key = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T2.crypto, sessionKeyForHKDF, true);
      const encryptionItemT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT2Key);
      const encryptionItemT2KeyAES_B64 = ArrayBufferToBase64(encryptionItemT2KeyAESRaw);

      // save encryptionItemT2Key in session storage
      const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: state.deviceId, itemId: info.data.id });
      await storage.setItem(`session:${itemT2Key}`, encryptionItemT2KeyAES_B64);
    } else {
      throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginAddedWrongSecurityType);
    }

    // Remove items from session storage (by itemsKeys)
    await storage.removeItems(itemsKeys);

    // saveItems
    await saveItems(items, state.deviceId, info.data.vaultId);

    // saveTags
    const tagsKey = await getKey('tags', { vaultId: info.data.vaultId, deviceId: state.deviceId });
    await storage.removeItem(`session:${tagsKey}`);
    await saveTags(info.tags, state.deviceId, info.data.vaultId);

    // Set alarm for reset T2 SIF
    if (info.data.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await browser.alarms.create(`sifT2Reset-${info.data.deviceId}|${info.data.vaultId}|${info.data.id}`, { delayInMinutes: sifResetTime });
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
