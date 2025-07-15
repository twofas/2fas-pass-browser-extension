// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from '@/partials/URIMatcher';
import getServices from '@/partials/sessionStorage/getServices';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

/** 
* Function to set the browser action badge and icon based on the current URL and tab ID.
* @async
* @param {string} url - The URL of the current tab.
* @param {number|null} tabId - The ID of the current tab.
* @param {Array|null} services - The list of services to match against the URL.
* @return {Promise<void>} A promise that resolves when the badge and icon are set.
*/
const setBadge = async (url, tabId = null, services = null) => {
  let configured = false;

  try {
    configured = await getConfiguredBoolean();
  } catch (e) {
    await CatchError(e);
  }

  let path = {};

  if (!configured) {
    // Lock
    path = {
      19: browser.runtime.getURL('icons/accounts-badge/icon19.png'),
      38: browser.runtime.getURL('icons/accounts-badge/icon38.png')
    };
  } else {
    path = {
      16: browser.runtime.getURL('icons/icon16.png'),
      32: browser.runtime.getURL('icons/icon32.png'),
      48: browser.runtime.getURL('icons/icon48.png'),
      96: browser.runtime.getURL('icons/icon96.png'),
      128: browser.runtime.getURL('icons/icon128.png')
    };
  }

  let matchingLogins = [];

  if (url) {
    try {
      if (!services) {
        services = await getServices();
      }
      
      matchingLogins = URIMatcher.getMatchedAccounts(services, url);
    } catch {}
  }

  if (!matchingLogins || matchingLogins.length <= 0) {
    try {
      await browser.action.setBadgeText({ text: '', tabId });
    } catch {}
  } else {
    const text = matchingLogins.length > 9 ? '9+' : matchingLogins.length.toString();

    try {
      await browser.action.setBadgeText({ text, tabId });
      await browser.action.setBadgeTextColor({ color: [255, 255, 255, 255], tabId });
      await browser.action.setBadgeBackgroundColor({ color: [13, 47, 170, 255], tabId });
    } catch {}
  }
  
  if (tabId) {
    try {
      await browser.action.setIcon({ path, tabId });
    } catch {}
  } else {
    try {
      await browser.action.setIcon({ path });
    } catch {}
  }
};

export default setBadge;
