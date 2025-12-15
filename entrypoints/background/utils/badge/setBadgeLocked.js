// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import setBadgeIcon from './setBadgeIcon';
import setBadgeText from './setBadgeText';
import getAllTabsIds from '../../tabs/getAllTabsIds';

/** 
* Function to set the browser action badge and icon when the service is locked.
* @async
* @param {number|null} tabId - The ID of the tab to set the badge and icon for.
* @return {Promise<void>} A promise that resolves when the badge and icon are set.
*/
const setBadgeLocked = async (tabId = null) => {
  if (!tabId) {
    const tabsIds = await getAllTabsIds();

    if (tabsIds.length > 0) {
      await Promise.all(
        tabsIds.map(id =>
          Promise.all([
            setBadgeIcon(false, id).catch(() => {}),
            setBadgeText(false, [], '', id).catch(() => {})
          ])
        )
      );
    }
  } else {
    await Promise.all([
      setBadgeIcon(false, tabId).catch(() => {}),
      setBadgeText(false, [], '', tabId).catch(() => {})
    ]);
  }
};

export default setBadgeLocked;
