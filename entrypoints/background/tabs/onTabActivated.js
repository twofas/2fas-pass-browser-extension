// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isTabIsPopupWindow from './isTabIsPopupWindow';
import updateNoAccountItem from '../contextMenu/updateNoAccountItem';
import getItems from '@/partials/sessionStorage/getItems';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import checkPromptCS from '@/partials/contentScript/checkPromptCS';
import tabIsInternal from '@/partials/functions/tabIsInternal';
import { sendDomainToPopupWindow, setBadgeLocked, setBadgeIcon, setBadgeText } from '../utils';

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

  logger.debug(LOGGER_CONSTANTS.CATEGORIES.BACKGROUND, 'TabHandler - tab activated', { tabId });

  let configured;

  try {
    configured = await getConfiguredBoolean('configured');

    if (!configured) {
      throw new Error();
    } else {
      await setBadgeIcon(true, tabId).catch(() => {});
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
    const [items, isPopupWindow] = await Promise.all([
      getItems().catch(() => []),
      isTabIsPopupWindow(tabId).catch(() => false)
    ]);

    if (tab?.url) {
      await setBadgeText(configured, items, tab.url, tabId).catch(e => CatchError(e));
    }

    if (!isPopupWindow) {
      const tasks = [
        sendDomainToPopupWindow(tabId).catch(() => {}),
        updateNoAccountItem(tabId, items).catch(() => {})
      ];

      // onTabUpdated injects prompt.js only into a tab that is active at status 'complete',
      // so a tab that finished loading in the background gets it on activation. A tab that
      // is still loading is left to onTabUpdated (it will be active when it completes).
      if (tab.status === 'complete' && !tab.discarded && !tabIsInternal(tab)) {
        tasks.push(checkPromptCS(tabId).catch(() => {}));
      }

      await Promise.all(tasks);
    }

    return true;
  } catch (e) {
    await CatchError(e);
    return false;
  }
};

export default onTabActivated;
