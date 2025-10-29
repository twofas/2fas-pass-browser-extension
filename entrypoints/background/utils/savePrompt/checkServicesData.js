// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';
import URIMatcher from '@/partials/URIMatcher';
import decryptValues from './decryptValues';

/** 
* Function to check the items data.
* @async
* @param {Object} details - The details of the tab.
* @param {Object} values - The values to check.
* @return {Promise<string|boolean>} A promise that resolves to a string indicating the item status or false if the data is valid.
*/
const checkServicesData = async (details, values) => {
  if (!details || !values) {
    // FUTURE - throw error?
    return false;
  }

  let items = [];

  try {
    items = await getItems();
  } catch (e) {
    await CatchError(e); // FUTURE - throw error
  }

  if (!items || !Array.isArray(items)) {
    return { type: 'newService' };
  }

  let matchedItems = [];

  try {
    matchedItems = URIMatcher.getMatchedAccounts(items, details.url);
  } catch {}

  if (!matchedItems || matchedItems.length <= 0) {
    return { type: 'newService' };
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
  const matchedItemsMatchedUsername = matchedItems.filter(item => item?.content?.username === decryptedValues.username);

  if (!matchedItemsMatchedUsername || matchedItemsMatchedUsername.length <= 0) {
    return { type: 'newService' };
  }

  // Decrypt passwords
  const matchedItemsDecryptedPasswords = [];

  for (const item of matchedItemsMatchedUsername) {
    let decryptedPassword;

    if (!item || !item.sifExists) {
      continue; // Skip if item or password is not defined
    }

    try {
      const decryptedData = await item.decryptSif();
      decryptedPassword = decryptedData.password;
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.checkServicesDataDecryptError, {
        event: e,
        additional: { func: 'checkServicesData' }
      });
    }

    matchedItemsDecryptedPasswords.push(decryptedPassword);
  }

  // Check password if is different
  const matchedItemsMatchedPassword = matchedItemsDecryptedPasswords.filter(p => p === decryptedValues.password);

  if (!matchedItemsMatchedPassword || matchedItemsMatchedPassword.length <= 0) {
    // FUTURE - ask user which service to update if there is more than one
    return {
      type: 'updateService',
      contentType: matchedItemsMatchedUsername[0].contentType,
      deviceId: matchedItemsMatchedUsername[0].deviceId,
      vaultId: matchedItemsMatchedUsername[0].vaultId,
      itemId: matchedItemsMatchedUsername[0].id
    };
  } else {
    return false;
  }
};

export default checkServicesData;
