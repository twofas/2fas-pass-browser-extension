// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { badgeIcons } from '@/constants';

/**
* Function to set the browser action badge icon based on the configured state.
* When called without tabId, sets the global default icon for all tabs.
* When called with tabId, sets a per-tab override for that specific tab.
* @async
* @param {boolean} configured - Indicates whether the application is configured.
* @param {number|null} tabId - Optional tab ID for per-tab override.
* @return {Promise<void>} A promise that resolves when the badge icon is set.
*/
const setBadgeIcon = async (configured, tabId = null) => {
  if (typeof configured !== 'boolean') {
    throw new Error('Configured parameter must be a boolean');
  }

  const icons = badgeIcons();
  const path = configured ? icons.configured : icons.notConfigured;

  await browser.action.setIcon(tabId ? { path, tabId } : { path }).catch(() => {});
};

export default setBadgeIcon;
