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
import Login from '@/partials/models/itemModels/Login';

/** 
* Handles the update of a item after it has been modified.
* @param {Object} data - The data object.
* @param {Object} state - The state object.
* @param {ArrayBuffer} hkdfSaltAB - The HKDF salt as an ArrayBuffer.
* @param {ArrayBuffer} sessionKeyForHKDF - The session key for HKDF as an ArrayBuffer.
* @param {string} messageId - The message ID.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const updateDataUpdated = async (info, state, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  console.log(info, state.data);

  if (!info || !info?.data) { // @TODO: Fix in future
    throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginUpdatedWrongData);
  }

  try {
    const [items, itemsKeys] = await Promise.all([
      getItems(),
      getItemsKeys(state.data.deviceId, info.data.vaultId)
    ]);

    // Update login & clear alarm if exists
    const itemIndex = items.findIndex(item => item.id === state.data.itemId);
    const originalItem = items.find(item => item.id === state.data.itemId);

    if (originalItem && originalItem.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await browser.alarms.clear(`sifT2Reset-${state.data.deviceId}|${state.data.vaultId}|${state.data.itemId}`);
    }

    const item = new Login(info.data, info.data.vaultId, state.data.deviceId);
    console.log('ITEM:', item);

    if (item.securityType === SECURITY_TIER.SECRET) {
      item.internalData.type = 'added';
    }

    const sifResetTime = info.expireInSeconds && info.expireInSeconds > 30 ? info.expireInSeconds / 60 : config.passwordResetDelay;

    if (item.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      item.internalData.sifResetTime = sifResetTime;
    }

    items[itemIndex] = item;

    if (item.securityType === SECURITY_TIER.SECRET) {
      // generate encryptionItemT3Key
      const encryptionItemT3Key = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T3.crypto, sessionKeyForHKDF, true);
      const encryptionItemT3KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT3Key);
      const encryptionItemT3KeyAES_B64 = ArrayBufferToBase64(encryptionItemT3KeyAESRaw);

      // save encryptionItemT3Key in session storage
      const itemT3Key = await getKey(ENCRYPTION_KEYS.ITEM_T3_NEW.sK, { deviceId: item.deviceId, itemId: item.id });
      await storage.setItem(`session:${itemT3Key}`, encryptionItemT3KeyAES_B64);
    } else if (item.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      // generate encryptionItemT2Key
      const encryptionItemT2Key = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T2.crypto, sessionKeyForHKDF, true);
      const encryptionItemT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT2Key);
      const encryptionItemT2KeyAES_B64 = ArrayBufferToBase64(encryptionItemT2KeyAESRaw);

      // save encryptionItemT2Key in session storage
      const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: item.deviceId, itemId: item.id });
      await storage.setItem(`session:${itemT2Key}`, encryptionItemT2KeyAES_B64);
    } else {
      throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginUpdatedWrongSecurityType);
    }

    // Remove items from session storage (by itemsKeys)
    await storage.removeItems(itemsKeys);

    // saveItems
    await saveItems(items, state.data.deviceId, info.data.vaultId);

    // saveTags
    const tagsKey = await getKey('tags', { vaultId: info.data.vaultId, deviceId: state.data.deviceId });
    await storage.removeItem(`session:${tagsKey}`);
    await saveTags(info.tags, state.data.deviceId, info.data.vaultId);

    // Set alarm for reset T2 SIF
    if (item.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await browser.alarms.create(`sifT2Reset-${state.data.deviceId}|${info.data.vaultId}|${state.data.itemId}`, { delayInMinutes: sifResetTime });
    }

    await sendPullRequestCompleted(messageId);

    return {
      returnUrl: `/details/${state.data.deviceId}/${info.data.vaultId}/${state.data.itemId}`,
      returnToast: {
        text: browser.i18n.getMessage('fetch_update_login_updated_toast'),
        type: 'success'
      }
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginUpdatedError, { event: e });
  }
};

export default updateDataUpdated;
