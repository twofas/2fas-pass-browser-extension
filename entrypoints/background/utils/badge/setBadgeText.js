// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from '@/partials/URIMatcher';

/** 
* Function to set the browser action badge text based on the current URL and services.
* @async
* @param {boolean} configured - Indicates if the badge should be configured.
* @param {Array} services - The list of services to check against.
* @param {string} url - The current URL to match.
* @param {number} tabId - The ID of the tab to update.
* @return {Promise<void>} A promise that resolves when the badge text is set.
*/
const setBadgeText = async (configured, services, url, tabId) => {
  if (typeof configured !== 'boolean') {
    throw new Error('Configured parameter must be a boolean');
  }

  if (!configured) {
    try {
      if (tabId) {
        await browser.action.setBadgeText({ text: '', tabId });
      } else {
        await browser.action.setBadgeText({ text: '' });
      }
    } catch {}

    return;
  }

  if (!Array.isArray(services)) {
    throw new Error('Services parameter must be an array');
  }

  if (typeof url !== 'string') {
    throw new Error('URL parameter must be a string');
  }

  if (typeof tabId !== 'number') {
    throw new Error('Tab ID must be a number');
  }

  let matchingLogins = [];

  try {
    matchingLogins = await URIMatcher.getMatchedAccounts(services, url);
  } catch {}

  if (!matchingLogins || matchingLogins.length <= 0) {
    try {
      if (tabId) {
        await browser.action.setBadgeText({ text: '', tabId });
      } else {
        await browser.action.setBadgeText({ text: '' });
      }
    } catch {}
  } else {
    const text = matchingLogins.length > 9 ? '9+' : matchingLogins.length.toString();

    await Promise.all([
      browser?.action?.setBadgeTextColor && typeof browser.action.setBadgeTextColor === 'function' ? browser.action.setBadgeTextColor({ color: [255, 255, 255, 255] }) : () => {},
      browser?.action?.setBadgeBackgroundColor && typeof browser.action.setBadgeBackgroundColor === 'function' ? browser.action.setBadgeBackgroundColor({ color: [13, 47, 170, 255] }) : () => {},
      tabId ? browser?.action?.setBadgeText && typeof browser.action.setBadgeText === 'function' ? browser.action.setBadgeText({ text, tabId }) : () => {} : browser?.action?.setBadgeText && typeof browser.action.setBadgeText === 'function' ? browser.action.setBadgeText({ text }) : () => {}
    ]);
  }
};

export default setBadgeText;
