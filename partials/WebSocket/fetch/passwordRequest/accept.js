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
import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';
import generateNonce from '@/partials/functions/generateNonce';

// FUTURE - Better error handling

/** 
* Handles the acceptance of a password request.
* @param {Object} data - The data object.
* @param {Object} state - The state object.
* @param {ArrayBuffer} hkdfSaltAB - The HKDF salt as an ArrayBuffer.
* @param {ArrayBuffer} sessionKeyForHKDF - The session key for HKDF as an ArrayBuffer.
* @param {string} messageId - The message ID.
* @return {Promise<Object>} Object containing returnUrl and returnToast or action for autofill.
*/
const passwordRequestAccept = async (data, state, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  try {
    // Autofill from shortcut or handleAutofill
    if (state?.from === 'shortcut' || state?.from === 'autofill') {
      // Get services
      const services = await getServices();

      // Get service (for username only)
      const service = services.find(service => service.id === state.data.loginId);

      // Decrypt password
      const password = data.passwordEnc;
      const tabId = state.data.tabId;
      
      const passwordAB = Base64ToArrayBuffer(password);
      const passwordDecryptedBytes = DecryptBytes(passwordAB);
      
      const encryptionPassT2Key = await generateEncryptionAESKey(hkdfSaltAB, StringToArrayBuffer('PassT2'), sessionKeyForHKDF, true);

      const decryptedPasswordAB = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: passwordDecryptedBytes.iv },
        encryptionPassT2Key,
        passwordDecryptedBytes.data
      );
      const decryptedPassword = ArrayBufferToString(decryptedPasswordAB);
      const nonce = generateNonce();
      const localKey = await storage.getItem('local:lKey');

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
      const encryptedValueB64 = ArrayBufferToBase64(encryptedValue);

      // Send autofill to tab
      const autofillRes = await sendMessageToAllFrames(
        tabId,
        {
          action: REQUEST_ACTIONS.AUTOFILL,
          username: service.username,
          password: encryptedValueB64,
          target: REQUEST_TARGETS.CONTENT
        }
      );
      
      // Send response
      await sendPullRequestCompleted(messageId);

      if (state?.from === 'shortcut') {
        return { windowClose: true };
      }
      
      if (state?.from === 'autofill') {
        return {
          action: 'autofill',
          autofillRes,
          loginId: state.data.loginId,
          deviceId: state.data.deviceId,
          password: password,
          hkdfSaltAB,
          sessionKeyForHKDF
        };
      }
    }

    // Get services
    const services = await getServices();

    // Get servicesKeys
    const servicesKeys = await getServicesKeys(state.data.deviceId);

    // Update password
    const service = services.find(service => service.id === state.data.loginId);
    service.password = data.passwordEnc;

    // Compress services
    const servicesStringify = JSON.stringify(services);
    const servicesGZIP_AB = await compress(servicesStringify);
    const servicesGZIP = ArrayBufferToBase64(servicesGZIP_AB);

    // generate encryptionPassT2Key
    const encryptionPassT2Key = await generateEncryptionAESKey(hkdfSaltAB, StringToArrayBuffer('PassT2'), sessionKeyForHKDF, true);
    const encryptionPassT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionPassT2Key);
    const encryptionPassT2KeyAES_B64 = ArrayBufferToBase64(encryptionPassT2KeyAESRaw);

    // save encryptionPassT2Key in session storage
    const passT2Key = await getKey('pass_key_t2', { deviceId: state.data.deviceId, loginId: state.data.loginId });
    await storage.setItem(`session:${passT2Key}`, encryptionPassT2KeyAES_B64);

    // Remove services from session storage (by servicesKeys)
    await storage.removeItems(servicesKeys);

    // saveServices
    await saveServices(servicesGZIP, state.data.deviceId);

    // Set alarm for 3 minutes
    await browser.alarms.create(`passwordT2Reset-${state.data.loginId}`, { delayInMinutes: config.passwordResetDelay });

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
    throw new TwoFasError(TwoFasError.errors.pullRequestActionPasswordRequestAcceptError);
  }
};

export default passwordRequestAccept;
