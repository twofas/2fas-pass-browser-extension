// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get the badge icons based on the configured state.
* @return {Object} An object containing the badge icons for both configured and not configured states.
*/
const badgeIcons = () => {
  return {
    configured: {
      16: browser.runtime.getURL('icons/icon16.png'),
      32: browser.runtime.getURL('icons/icon32.png'),
      48: browser.runtime.getURL('icons/icon48.png'),
      96: browser.runtime.getURL('icons/icon96.png'),
      128: browser.runtime.getURL('icons/icon128.png')
    },
    notConfigured: {
      19: browser.runtime.getURL('icons/accounts-badge/icon19.png'),
      38: browser.runtime.getURL('icons/accounts-badge/icon38.png')
    }
  };
};

export default badgeIcons;
