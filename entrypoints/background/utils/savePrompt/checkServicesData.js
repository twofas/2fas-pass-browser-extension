// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';
import URIMatcher from '@/partials/URIMatcher';
import { getPageUrl } from '@/partials/functions';
import trimString from '@/partials/functions/trimString';
import decryptValues from './decryptValues';

/**
* Function to normalize a username for comparison: trimmed and lowercased.
* @param {string} username - The username.
* @return {string} The normalized username.
*/
const normalizeUsername = username => String(trimString(username) || '').toLowerCase();

/**
* Function to check the items data. The typed username is compared with the stored ones trimmed, as it is saved, and
* without letter case (Jan@Example.com and jan@example.com are one login); the password is never trimmed, so it is
* compared exactly. Stored URI rules are matched against the page that sent the request and the full tab URL, because
* Chromium reports only the origin as the initiator and a StartsWith or Exact rule would not match it.
* @async
* @param {Object} details - The details of the tab.
* @param {Object} values - The values to check.
* @param {string} [tabUrl] - Optional tab URL fallback for URI matching.
* @return {Promise<string|boolean>} A promise that resolves to a string indicating the item status or false if the data is valid.
*/
const checkServicesData = async (details, values, tabUrl) => {
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

  const matchedItems = [];
  const matchUrls = [...new Set([getPageUrl(details, tabUrl), tabUrl].filter(Boolean))];

  matchUrls.forEach(matchUrl => {
    try {
      URIMatcher.getMatchedAccounts(items, matchUrl).forEach(item => {
        if (!matchedItems.includes(item)) {
          matchedItems.push(item);
        }
      });
    } catch {}
  });

  if (matchedItems.length <= 0) {
    return { type: 'newService' };
  }

  let decryptedValues;

  if (values?.usernameEncrypted || values?.passwordEncrypted) {
    decryptedValues = await decryptValues(values);
  } else {
    decryptedValues = {
      username: values.username,
      password: values.password
    };
  }

  const username = normalizeUsername(decryptedValues.username);

  // Check username if exists
  const matchedItemsMatchedUsername = matchedItems.filter(item => normalizeUsername(item?.content?.username) === username);

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
