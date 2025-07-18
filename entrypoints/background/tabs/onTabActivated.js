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
import setBadgeLocked from '../utils/setBadgeLocked';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

/** 
* Function to handle tab activation in the browser.
* @async
* @param {Object} tab - The tab that was activated.
* @return {Promise<boolean>} A promise that resolves to true if the tab activation was handled successfully, false otherwise.
*/
const onTabActivated = async ({ tabId }) => {
  if (!tabId) {
    return false;
  }

  let configured;

  try {
    configured = await getConfiguredBoolean('configured');

    if (!configured) {
      throw new Error();
    }
  } catch {
    await setBadgeLocked(tabId).catch(() => {});
    return false;
  }

  let tab;

  try {
    tab = await browser.tabs.get(tabId);
  } catch {
    return false;
  }

  if (!tab || !tab.active || !tab.url || tab.url === 'about:blank') {
    return false;
  }

  try {
    const [services, isPopupWindow] = await Promise.all([
      getServices().catch(() => []),
      isTabIsPopupWindow(tabId).catch(() => false)
    ]);

    if (tab.url) {
      setBadge(tab.url, tabId, services).catch(e => CatchError(e));
    }

    if (!isPopupWindow) {
      await Promise.all([
        sendDomainToPopupWindow(tabId),
        updateNoAccountItem(tabId, services)
      ]).catch(e => CatchError(e));
    }

    return true;
  } catch (e) {
    await CatchError(e);
    return false;
  }
};

export default onTabActivated;
