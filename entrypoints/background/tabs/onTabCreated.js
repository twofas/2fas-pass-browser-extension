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
* Function to handle tab creation in the browser.
* @async
* @param {Object} tab - The tab that was created.
* @return {Promise<void>} A promise that resolves when the tab creation is complete.
*/
const onTabCreated = async tab => {
  if (!tab || !tab.active || !tab.url || tab.url === 'about:blank') {
    return false;
  }

  let configured;

  try {
    configured = await getConfiguredBoolean('configured');

    if (!configured) {
      throw new Error();
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

    if (tab.url && tab.id) {
      setBadge(tab.url, tab.id, services).catch(e => CatchError(e));
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

export default onTabCreated;
