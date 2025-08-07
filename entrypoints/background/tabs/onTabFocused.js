// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendDomainToPopupWindow from '../utils/sendDomainToPopupWindow';
import isTabIsPopupWindow from './isTabIsPopupWindow';
import updateNoAccountItem from '../contextMenu/updateNoAccountItem';
import getServices from '@/partials/sessionStorage/getServices';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import setBadgeLocked from '../utils/badge/setBadgeLocked';
import setBadgeIcon from '../utils/badge/setBadgeIcon';
import setBadgeText from '../utils/badge/setBadgeText';

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
    const [services, isPopupWindow] = await Promise.all([
      getServices().catch(() => []),
      isTabIsPopupWindow(tab.id).catch(() => false)
    ]);

    if (tab?.url) {
      await setBadgeText(configured, services, tab.url, tab.id).catch(e => CatchError(e));
    }

    if (!isPopupWindow) {
      await Promise.all([
        sendDomainToPopupWindow(tab.id),
        updateNoAccountItem(tab.id, services)
      ]).catch(e => CatchError(e));
    }

    return true;
  } catch (e) {
    await CatchError(e);
    return false;
  }
};

export default onTabFocused;
