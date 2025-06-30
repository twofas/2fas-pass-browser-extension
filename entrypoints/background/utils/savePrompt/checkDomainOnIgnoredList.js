// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to check if a domain is on the ignored list.
* @async
* @param {string} detailsUrl - The URL of the details page.
* @return {Promise<boolean>} A promise that resolves to true if the domain is ignored, false otherwise.
*/
const checkDomainOnIgnoredList = async detailsUrl => {
  let storageIgnoreList = await storage.getItem('local:savePromptIgnoreDomains');

  if (!storageIgnoreList || !Array.isArray(storageIgnoreList)) {
    storageIgnoreList = [];
    await storage.setItem('local:savePromptIgnoreDomains', storageIgnoreList);
  }

  if (detailsUrl) {
    let url;

    try {
      url = new URL(detailsUrl);
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.checkDomainOnIgnoredListUrlError, {
        event: e,
        additional: { func: 'checkDomainOnIgnoredList' }
      });
    }

    if (storageIgnoreList && Array.isArray(storageIgnoreList) && storageIgnoreList.includes(url.hostname)) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

export default checkDomainOnIgnoredList;
