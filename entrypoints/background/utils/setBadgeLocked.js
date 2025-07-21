// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to set the browser action badge and icon when the service is locked.
* @async
* @param {number|null} tabId - The ID of the tab to set the badge and icon for.
* @return {Promise<void>} A promise that resolves when the badge and icon are set.
*/
const setBadgeLocked = async (tabId = null) => {
  const path = {
    19: browser.runtime.getURL('icons/accounts-badge/icon19.png'),
    38: browser.runtime.getURL('icons/accounts-badge/icon38.png')
  };

  if (tabId) {
    try {
      await Promise.all([
        browser.action.setBadgeText({ text: '', tabId }),
        browser.action.setIcon({ path, tabId })
      ]);
    } catch {}
  } else {
    try {
      await Promise.all([
        browser.action.setBadgeText({ text: '' }),
        browser.action.setIcon({ path })
      ]);
    } catch {}
  }

  return;
};

export default setBadgeLocked;
