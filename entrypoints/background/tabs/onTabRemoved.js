// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';

/**
* Function to handle tab removal in the browser.
* Cleans up tab data from memory and session storage for garbage collection.
* @param {number} tabId - The ID of the tab that was removed.
* @param {Object} tabsInputData - The current state of the tabs.
* @return {void}
*/
const onTabRemoved = async (tabId, tabsInputData) => {
  if (tabsInputData[tabId]) {
    delete tabsInputData[tabId];
  }

  try {
    const popupStateKey = await getKey('popup_state');
    const storageKey = `session:${popupStateKey}`;
    const currentStorage = await storage.getItem(storageKey);

    if (currentStorage?.[tabId]) {
      delete currentStorage[tabId];
      await storage.setItem(storageKey, currentStorage);
    }
  } catch (e) {
    CatchError(e);
  }
};

export default onTabRemoved;
