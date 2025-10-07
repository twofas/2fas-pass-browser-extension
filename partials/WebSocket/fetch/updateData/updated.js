// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';
import getServices from '@/partials/sessionStorage/getServices';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import generateEncryptionAESKey from '@/partials/WebSocket/utils/generateEncryptionAESKey';
import getKey from '@/partials/sessionStorage/getKey';
import compress from '@/partials/gzip/compress';
import saveItems from '@/partials/WebSocket/utils/saveItems';
import { ENCRYPTION_KEYS } from '@/constants';

/** 
* Handles the update of a item after it has been modified.
* @param {Object} data - The data object.
* @param {Object} state - The state object.
* @param {ArrayBuffer} hkdfSaltAB - The HKDF salt as an ArrayBuffer.
* @param {ArrayBuffer} sessionKeyForHKDF - The session key for HKDF as an ArrayBuffer.
* @param {string} messageId - The message ID.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const updateDataUpdated = async (data, state, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  if (!data || !data?.login || !data?.login?.deviceId || !data?.login?.id) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginUpdatedWrongData);
  }

  try {
    const [services, itemsKeys] = await Promise.all([
      getServices(),
      getItemsKeys(state.data.deviceId)
    ]);

    // Update login & clear alarm if exists
    const serviceIndex = services.findIndex(service => service.id === state.data.itemId);
    let service = services.find(service => service.id === state.data.itemId);

    if (service && service.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await browser.alarms.clear(`passwordT2Reset-${state.data.itemId}`);
    }

    service = data.login;

    if (data.login.securityType === SECURITY_TIER.SECRET) {
      service.internalType = 'added';
    }

    services[serviceIndex] = service;

    // Compress services
    const servicesStringify = JSON.stringify(services);
    const servicesGZIP_AB = await compress(servicesStringify);
    const servicesGZIP = ArrayBufferToBase64(servicesGZIP_AB);

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
      throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginUpdatedWrongSecurityType);
    }

    // Remove items from session storage (by itemsKeys)
    await storage.removeItems(itemsKeys);

    // saveItems
    await saveItems(servicesGZIP, data.login.deviceId);

    // Set alarm for 3 minutes if T2
    if (data.login.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await browser.alarms.create(`passwordT2Reset-${data.login.id}`, { delayInMinutes: config.passwordResetDelay });
    }

    await sendPullRequestCompleted(messageId);

    return {
      returnUrl: `/details/${state.data.itemId}`,
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
