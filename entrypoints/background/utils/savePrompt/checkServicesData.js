// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getServices from '@/partials/sessionStorage/getServices';
import URIMatcher from '@/partials/URIMatcher';
import decryptPassword from '@/partials/functions/decryptPassword';
import decryptValues from './decryptValues';

/** 
* Function to check the services data.
* @async
* @param {Object} details - The details of the tab.
* @param {Object} values - The values to check.
* @return {Promise<string|boolean>} A promise that resolves to a string indicating the service status or false if the data is valid.
*/
const checkServicesData = async (details, values) => {
  if (!details || !values) {
    // FUTURE - throw error?
    return false;
  }

  let services = [];

  try {
    services = await getServices();
  } catch (e) {
    await CatchError(e); // FUTURE - throw error
  }

  if (!services || !Array.isArray(services)) {
    return 'newService';
  }

  let matchedServices = [];

  try {
    matchedServices = URIMatcher.getMatchedAccounts(services, details.url);
  } catch {}

  if (!matchedServices || matchedServices.length <= 0) {
    return 'newService'; 
  }

  let decryptedValues;

  if (values?.encrypted) {
    decryptedValues = await decryptValues(values);
  } else {
    decryptedValues = {
      username: values.username,
      password: values.password
    };
  }

  // Check username if exists
  const matchedServicesMatchedUsername = matchedServices.filter(service => service.username === decryptedValues.username);

  if (!matchedServicesMatchedUsername || matchedServicesMatchedUsername.length <= 0) {
    return 'newService';
  }

  // Decrypt passwords
  const matchedServicesDecryptedPasswords = [];

  for (const service of matchedServicesMatchedUsername) {
    let decryptedPassword;

    if (!service || !service.password) {
      continue; // Skip if service or password is not defined
    }

    try {
      decryptedPassword = await decryptPassword(service);
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.checkServicesDataDecryptError, {
        event: e,
        additional: { func: 'checkServicesData' }
      });
    }

    matchedServicesDecryptedPasswords.push(decryptedPassword);
  }

  // Check password if is different
  const matchedServicesMatchedPassword = matchedServicesDecryptedPasswords.filter(p => p === decryptedValues.password);

  if (!matchedServicesMatchedPassword || matchedServicesMatchedPassword.length <= 0) {
    return 'updateService';
  } else {
    return false;
  }
};

export default checkServicesData;
