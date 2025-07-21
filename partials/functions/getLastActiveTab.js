// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Get the last active tab.
* @async
* @param {Function} onCatch - Function to run if no tabs are found.
* @param {Function} filter - Function to filter the tabs.
* @return {Object} - The last active tab.
*/
const getLastActiveTab = async (onCatch, filter = null) => {
  let tabs, lastFocusedWindow;

  try {
    lastFocusedWindow = await browser.windows.getLastFocused({ windowTypes: ['normal'] });
  } catch {}

  try {
    if (lastFocusedWindow && lastFocusedWindow?.id) {
      tabs = await browser.tabs.query({ active: true, windowId: lastFocusedWindow.id });
    } else {
      tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true, windowType: 'normal' });
    }
  } catch {}

  if (filter) {
    tabs = tabs.filter(filter);
  }

  if (!tabs || tabs.length <= 0) {
    try {
      tabs = await browser.tabs.query({ active: true, windowType: 'normal' });
    } catch {}
  }

  if (filter) {
    tabs = tabs.filter(filter);
  }

  if (!tabs || tabs.length <= 0) {
    if (onCatch && typeof onCatch === 'function') {
      onCatch();
    }

    return false;
  }

  tabs = tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);

  if (tabs[0]) {
    return tabs[0];
  }

  return false;
};

export default getLastActiveTab;
