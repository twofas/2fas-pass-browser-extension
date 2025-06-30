// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to handle tab removal in the browser.
* @param {number} tabId - The ID of the tab that was removed.
* @param {Object} tabsInputData - The current state of the tabs.
* @return {void}
*/
const onTabRemoved = (tabId, tabsInputData) => {
  if (tabsInputData[tabId]) {
    delete tabsInputData[tabId];
  }
};

export default onTabRemoved;
