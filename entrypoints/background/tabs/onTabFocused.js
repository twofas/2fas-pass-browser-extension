// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendDomainToPopupWindow from '../utils/sendDomainToPopupWindow';
import isTabIsPopupWindow from './isTabIsPopupWindow';
import setBadge from '../utils/setBadge';
import updateNoAccountItem from '../contextMenu/updateNoAccountItem';

/** 
* Function to handle tab focus in the browser.
* @async
* @param {Object} tab - The tab object representing the focused tab.
* @return {Promise<void>} A promise that resolves when the tab focus is handled.
*/
const onTabFocused = async tab => {
  let pw;

  if (tab?.url) {
    try {
      await setBadge(tab.url, tab.id);
    } catch (e) {
      await CatchError(e);
    }
  }

  try {
    pw = await isTabIsPopupWindow(tab.id);
  } catch {
    pw = false;
  }

  if (!pw) {
    try {
      await sendDomainToPopupWindow(tab.id);
      await updateNoAccountItem(tab.id);
    } catch (e) {
      await CatchError(e);
    }
  }
};

export default onTabFocused;
