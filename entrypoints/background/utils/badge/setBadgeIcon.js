// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { badgeIcons } from '@/constants';
import getAllTabsIds from '../../tabs/getAllTabsIds';

/** 
* Function to set the browser action badge icon based on the configured state.
* @async
* @param {boolean} configured - Indicates whether the application is configured.
* @return {Promise<void>} A promise that resolves when the badge icon is set.
*/
const setBadgeIcon = async (configured, tabId = null) => {
  if (typeof configured !== 'boolean') {
    throw new Error('Configured parameter must be a boolean');
  }

  const icons = badgeIcons();
  const path = configured ? icons.configured : icons.notConfigured;

  if (tabId) {
    await browser.action.setIcon({ path, tabId }).catch(() => {});
  } else {
    const tabsIds = await getAllTabsIds();

    if (tabsIds.length > 0) {
      await Promise.all(tabsIds.map(id => browser.action.setIcon({ path, tabId: id }).catch(() => {})));
    }
  }
};

export default setBadgeIcon;
