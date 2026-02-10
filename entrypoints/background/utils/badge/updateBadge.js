// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLastActiveTab from '@/partials/functions/getLastActiveTab';
import setBadgeIcon from './setBadgeIcon';
import setBadgeText from './setBadgeText';
import getAllTabsIds from '../../tabs/getAllTabsIds';

/** 
* Function to update the browser badge based on the last active tab's URL.
* @async
* @param {Array} services - Optional array of services to use for badge updates.
* @return {Promise<void>} A promise that resolves when the badge is updated.
*/
const updateBadge = async (configured, services = null, tabId = null) => {
  if (typeof configured !== 'boolean') {
    throw new Error('Configured must be a boolean value');
  }

  const tabsIds = await getAllTabsIds().catch(() => []);

  if (!tabId) {
    let tab;

    try {
      tab = await getLastActiveTab();
      tabId = tab?.id;
    } catch {}
  }

  await setBadgeIcon(configured).catch(() => {});

  if (tabsIds.length > 0) {
    await Promise.all(tabsIds.map(id => setBadgeIcon(configured, id).catch(() => {})));
  }

  if (configured) {
    if (!services || services.length === 0) {
      throw new Error('Services must be provided when configured is true');
    }

    let tabUrl = '';

    try {
      const tab = await browser.tabs.get(tabId);
      tabUrl = tab?.url || '';
    } catch {}

    if (tabId) {
      await setBadgeText(true, services, tabUrl, tabId).catch(() => {});
    }
  } else {
    await Promise.all(tabsIds.map(id => setBadgeText(false, [], null, id).catch(() => {})));
  }
};

export default updateBadge;
