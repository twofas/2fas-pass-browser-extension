// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';
import getServices from '@/partials/sessionStorage/getServices';
import getServicesKeys from '@/partials/sessionStorage/getServicesKeys';
import generateEncryptionAESKey from '@/partials/WebSocket/utils/generateEncryptionAESKey';
import getKey from '@/partials/sessionStorage/getKey';
import compress from '@/partials/gzip/compress';
import saveServices from '@/partials/WebSocket/utils/saveServices';

/** 
* Handles the addition of a new login.
* @param {Object} data - The data object.
* @param {ArrayBuffer} hkdfSaltAB - The HKDF salt as an ArrayBuffer.
* @param {ArrayBuffer} sessionKeyForHKDF - The session key for HKDF as an ArrayBuffer.
* @param {string} messageId - The message ID.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const newLoginAdded = async (data, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  if (!data || !data?.login || !data?.login?.deviceId || !data?.login?.id) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginAddedWrongData);
  }

  try {
    // Get services
    const services = await getServices();

    // Get servicesKeys
    const servicesKeys = await getServicesKeys(data.login.deviceId);

    // Add new login to services
    const newService = { ...data.login, internalType: 'added' };
    services.push(newService);

    // Compress services
    const servicesStringify = JSON.stringify(services);
    const servicesGZIP_AB = await compress(servicesStringify);
    const servicesGZIP = ArrayBufferToBase64(servicesGZIP_AB);

    if (data.login.securityType === SECURITY_TIER.SECRET) {
      // generate encryptionPassT3Key
      const encryptionPassT3Key = await generateEncryptionAESKey(hkdfSaltAB, StringToArrayBuffer('PassT3'), sessionKeyForHKDF, true);
      const encryptionPassT3KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionPassT3Key);
      const encryptionPassT3KeyAES_B64 = ArrayBufferToBase64(encryptionPassT3KeyAESRaw);

      // save encryptionPassT3Key in session storage
      const passT3Key = await getKey('pass_key_t3_new', { deviceId: data.login.deviceId, loginId: data.login.id });
      await storage.setItem(`session:${passT3Key}`, encryptionPassT3KeyAES_B64);
    } else if (data.login.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      // generate encryptionPassT2Key
      const encryptionPassT2Key = await generateEncryptionAESKey(hkdfSaltAB, StringToArrayBuffer('PassT2'), sessionKeyForHKDF, true);
      const encryptionPassT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionPassT2Key);
      const encryptionPassT2KeyAES_B64 = ArrayBufferToBase64(encryptionPassT2KeyAESRaw);

      // save encryptionPassT2Key in session storage
      const passT2Key = await getKey('pass_key_t2', { deviceId: data.login.deviceId, loginId: data.login.id });
      await storage.setItem(`session:${passT2Key}`, encryptionPassT2KeyAES_B64);
    } else {
      throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginAddedWrongSecurityType);
    }

    // Remove services from session storage (by servicesKeys)
    await storage.removeItems(servicesKeys);

    // saveServices
    await saveServices(servicesGZIP, data.login.deviceId);

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
    throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginAddedError);
  }
};

export default newLoginAdded;
