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
import { ENCRYPTION_KEYS } from '@/constants';

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
  const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: state.deviceId, loginId: state.loginId });
  await storage.setItem(`session:${itemT2Key}`, encryptionItemT2KeyAES_B64);

  // Remove services from session storage (by servicesKeys)
  await storage.removeItems(servicesKeys);

  // saveServices
  await saveServices(servicesGZIP, state.deviceId);
  
  // Set alarm for 3 minutes
  await browser.alarms.create(`passwordT2Reset-${state.loginId}`, { delayInMinutes: config.passwordResetDelay });
};

export default keepPassword;
