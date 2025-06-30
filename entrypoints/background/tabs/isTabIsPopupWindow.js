// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to check if a tab is a popup window.
* @async
* @param {number} tabID - The ID of the tab to check.
* @return {Promise<boolean>} A promise that resolves to true if the tab is a popup window, false otherwise.
*/
const isTabIsPopupWindow = async tabID => {
  let popupAsTab, extURL;

  if (!tabID) {
    return false;
  }

  try {
    extURL = browser.runtime.getURL('/popup.html');
  } catch {}

  if (!extURL) {
    return false;
  }

  try {
    popupAsTab = await browser.tabs.query({ url: extURL });
  } catch {}

  if (!popupAsTab || popupAsTab.length <= 0) {
    return false;
  }

  return popupAsTab.filter(context => context.id === tabID).length > 0
};

export default isTabIsPopupWindow;
