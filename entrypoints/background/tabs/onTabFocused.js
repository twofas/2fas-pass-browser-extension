// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendDomainToPopupWindow, setBadgeLocked, setBadgeIcon, setBadgeText } from '../utils';
import isTabIsPopupWindow from './isTabIsPopupWindow';
import updateNoAccountItem from '../contextMenu/updateNoAccountItem';
import getItems from '@/partials/sessionStorage/getItems';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

/** 
* Function to handle tab focus in the browser.
* @async
* @param {Object} tab - The tab object representing the focused tab.
* @return {Promise<void>} A promise that resolves when the tab focus is handled.
*/
const onTabFocused = async tab => {
  if (!tab || !tab?.active || !tab?.url || tab?.url === 'about:blank') {
    return false;
  }

  let configured;

  try {
    configured = await getConfiguredBoolean('configured');
    
    if (!configured) {
      throw new Error();
    } else {
      await setBadgeIcon(true, tab.id).catch(() => {});
    }
  } catch {
    await setBadgeLocked(tab.id).catch(() => {});
    return false;
  }

  try {
    const [items, isPopupWindow] = await Promise.all([
      getItems().catch(() => []),
      isTabIsPopupWindow(tab.id).catch(() => false)
    ]);

    if (tab?.url) {
      await setBadgeText(configured, items, tab.url, tab.id).catch(e => CatchError(e));
    }

    if (!isPopupWindow) {
      await Promise.all([
        sendDomainToPopupWindow(tab.id),
        updateNoAccountItem(tab.id, items)
      ]).catch(e => CatchError(e));
    }

    return true;
  } catch (e) {
    await CatchError(e);
    return false;
  }
};

export default onTabFocused;
