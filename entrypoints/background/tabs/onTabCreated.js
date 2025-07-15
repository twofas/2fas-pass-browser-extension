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
* Function to handle tab creation in the browser.
* @async
* @param {Object} tab - The tab that was created.
* @return {Promise<void>} A promise that resolves when the tab creation is complete.
*/
const onTabCreated = async tab => {
  let pw, services;

  try {
    services = await getServices();
  } catch {}

  if (tab?.url && tab?.id) {
    try {
      await setBadge(tab.url, tab.id, services);
    } catch (e) {
      await CatchError(e);
    }
  }

  try {
    pw = await isTabIsPopupWindow(tab.id);
  } catch {
    pw = false
  }

  if (!pw) {
    try {
      await sendDomainToPopupWindow(tab.id);
      await updateNoAccountItem(tab.id, services);
    } catch (e) {
      await CatchError(e);
    }
  }
};

export default onTabCreated;
