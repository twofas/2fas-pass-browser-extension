// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getServices from '@/partials/sessionStorage/getServices';
import getServicesKeys from '@/partials/sessionStorage/getServicesKeys';
import generateEncryptionAESKey from '@/partials/WebSocket/utils/generateEncryptionAESKey';
import getKey from '@/partials/sessionStorage/getKey';
import compress from '@/partials/gzip/compress';
import saveServices from '@/partials/WebSocket/utils/saveServices';

/** 
* Function to keep the password.
* @async
* @param {Object} state - The current state.
* @return {Promise<void>} A promise that resolves when the password is kept.
*/
const keepPassword = async state => {
  // Get services
  const services = await getServices();

  // Get servicesKeys
  const servicesKeys = await getServicesKeys(state.deviceId);

  // Update password
  const service = services.find(service => service.id === state.loginId);
  service.password = state.password;

  // Compress services
  const servicesStringify = JSON.stringify(services);
  const servicesGZIP_AB = await compress(servicesStringify);
  const servicesGZIP = ArrayBufferToBase64(servicesGZIP_AB);

  // generate encryptionPassT2Key
  const encryptionPassT2Key = await generateEncryptionAESKey(state.hkdfSaltAB, StringToArrayBuffer('PassT2'), state.sessionKeyForHKDF, true);
  let encryptionPassT2KeyAES_B64;

  try {
    const encryptionPassT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionPassT2Key);
    encryptionPassT2KeyAES_B64 = ArrayBufferToBase64(encryptionPassT2KeyAESRaw);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.keepPasswordExportKeyError, { event: e });
  }

  // save encryptionPassT2Key in session storage
  const passT2Key = await getKey('pass_key_t2', { deviceId: state.deviceId, loginId: state.loginId });
  await storage.setItem(`session:${passT2Key}`, encryptionPassT2KeyAES_B64);

  // Remove services from session storage (by servicesKeys)
  await storage.removeItems(servicesKeys);

  // saveServices
  await saveServices(servicesGZIP, state.deviceId);
  
  // Set alarm for 3 minutes
  await browser.alarms.create(`passwordT2Reset-${state.loginId}`, { delayInMinutes: config.passwordResetDelay });
};

export default keepPassword;
