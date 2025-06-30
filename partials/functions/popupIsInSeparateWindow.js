// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Checks if the popup is in a separate window.
* @async
* @return {boolean} Returns true if the popup is in a separate window, otherwise false.
*/
const popupIsInSeparateWindow = async () => {
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

  return popupAsTab && popupAsTab?.length > 0 ? true : false;
};

export default popupIsInSeparateWindow;
