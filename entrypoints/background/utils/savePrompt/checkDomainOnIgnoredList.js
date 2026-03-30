// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { parseDomain } from 'parse-domain';

/**
* Extracts the root domain (domain + TLD) from a hostname.
* Falls back to the original hostname if parsing fails.
* @param {string} hostname - The hostname to extract the root domain from.
* @return {string} The root domain or the original hostname.
*/
const getRootDomain = hostname => {
  try {
    const parsed = parseDomain(hostname);

    if (parsed?.domain && parsed?.topLevelDomains?.length > 0) {
      return `${parsed.domain}.${parsed.topLevelDomains.join('.')}`;
    }
  } catch {}

  return hostname;
};

/**
* Function to check if a domain is on the ignored list.
* Compares root domains so that www.example.com matches auth.example.com.
* @async
* @param {string} tabUrl - The full URL of the active tab.
* @return {Promise<boolean>} A promise that resolves to true if the domain is ignored, false otherwise.
*/
const checkDomainOnIgnoredList = async tabUrl => {
  let storageIgnoreList = await storage.getItem('local:savePromptIgnoreDomains');

  if (!storageIgnoreList || !Array.isArray(storageIgnoreList)) {
    storageIgnoreList = [];
    await storage.setItem('local:savePromptIgnoreDomains', storageIgnoreList);
  }

  if (!tabUrl) {
    return false;
  }

  let tabHostname;

  try {
    tabHostname = new URL(tabUrl).hostname;
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.checkDomainOnIgnoredListUrlError, {
      event: e,
      additional: { func: 'checkDomainOnIgnoredList' }
    });
  }

  const tabRootDomain = getRootDomain(tabHostname);

  return storageIgnoreList.some(domain => getRootDomain(domain) === tabRootDomain);
};

export default checkDomainOnIgnoredList;
export { getRootDomain };
