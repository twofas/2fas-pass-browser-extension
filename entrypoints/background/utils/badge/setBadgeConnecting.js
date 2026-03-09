// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { badgeIcons } from '@/constants';
import getAllTabsIds from '../../tabs/getAllTabsIds';

const setBadgeConnecting = async () => {
  const icons = badgeIcons();
  const path = icons.connecting;

  await browser.action.setIcon({ path }).catch(() => {});

  const tabsIds = await getAllTabsIds().catch(() => []);

  if (tabsIds.length > 0) {
    await Promise.all(
      tabsIds.map(id => Promise.all([
        browser.action.setIcon({ path, tabId: id }).catch(() => {}),
        browser.action.setBadgeText({ text: '', tabId: id }).catch(() => {})
      ]))
    );
  }
};

export default setBadgeConnecting;
