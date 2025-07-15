// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendDomainToPopupWindow from '../utils/sendDomainToPopupWindow';
import isTabIsPopupWindow from './isTabIsPopupWindow';
import setBadge from '../utils/setBadge';
import updateNoAccountItem from '../contextMenu/updateNoAccountItem';
import getServices from '@/partials/sessionStorage/getServices';

/** 
* Function to handle tab activation in the browser.
* @async
* @param {Object} tab - The tab that was activated.
* @return {Promise<boolean>} A promise that resolves to true if the tab activation was handled successfully, false otherwise.
*/
const onTabActivated = async ({ tabId }) => {
  let pw, tab, services;

  try {
    tab = await browser.tabs.get(tabId);
  } catch {
    return false;
  }

  try {
    services = await getServices();
  } catch {}

  if (tab?.url) {
    try {
      await setBadge(tab.url, tabId, services);
    } catch (e) {
      await CatchError(e);
    }
  }

  try {
    pw = await isTabIsPopupWindow(tabId);
  } catch {
    pw = false;
  }

  if (!pw) {
    try {
      await sendDomainToPopupWindow(tabId);
      await updateNoAccountItem(tabId, services);
    } catch (e) {
      await CatchError(e);
    }
  }
};

export default onTabActivated;
