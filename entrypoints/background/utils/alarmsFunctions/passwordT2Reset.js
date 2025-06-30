// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getServices from '@/partials/sessionStorage/getServices';
import getServicesKeys from '@/partials/sessionStorage/getServicesKeys';
import compress from '@/partials/gzip/compress';
import getKey from '@/partials/sessionStorage/getKey';
import saveServices from '@/partials/WebSocket/utils/saveServices';

/** 
* Function to forget the password for a specific login ID.
* @async
* @param {string} loginId - The ID of the login for which the password should be forgotten.
* @return {Promise<void>} A promise that resolves when the password forget is complete.
*/
const passwordT2Reset = async loginId => {
  // Get services
  const services = await getServices();

  // Update password
  const service = services.find(service => service.id === loginId);
  const deviceId = service.deviceId;
  delete service.password;

  // Get servicesKeys
  const servicesKeys = await getServicesKeys(deviceId);

  // Compress services
  const servicesStringify = JSON.stringify(services);
  const servicesGZIP_AB = await compress(servicesStringify);
  const servicesGZIP = ArrayBufferToBase64(servicesGZIP_AB);

  // Remove encryptionPassT2Key in session storage for this loginId & deviceId
  const passT2Key = await getKey('pass_key_t2', { deviceId, loginId });
  await storage.removeItem(`session:${passT2Key}`);

  // Remove services from session storage (by servicesKeys)
  await storage.removeItems(servicesKeys);

  // saveServices
  await saveServices(servicesGZIP, deviceId);
};

export default passwordT2Reset;
