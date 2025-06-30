// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Get the popup window data.
* @async
* @return {Array|boolean} Returns an array of contexts or false if no contexts are found.
*/
const getPopupWindowData = async () => {
  let popupAsTab, extURL;

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

  return popupAsTab[0];
};

export default getPopupWindowData;