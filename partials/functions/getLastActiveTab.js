// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const isDev = import.meta.env.DEV;

// DEV-only: Test context for E2E testing
let testContext = null;

/**
 * DEV-only: Set test context for E2E testing.
 * @param {Object|null} ctx - Test context with tabId or mockTab.
 */
export const setTestContext = isDev ? ctx => { testContext = ctx; } : () => {};

/**
 * DEV-only: Clear test context.
 */
export const clearTestContext = isDev ? () => { testContext = null; } : () => {};

/**
 * DEV-only: Get tab override from URL params or test context.
 * @async
 * @return {Object|null} Override tab object or null.
 */
const getDevTabOverride = async () => {
  if (!isDev) {
    return null;
  }

  // Priority 1: Programmatic test context (for unit/integration tests)
  if (testContext?.mockTab) {
    return testContext.mockTab;
  }

  if (testContext?.tabId) {
    try {
      return await browser.tabs.get(parseInt(testContext.tabId, 10));
    } catch {
      return null;
    }
  }

  // Priority 2: URL parameter (for E2E tests opening popup.html?tab=123)
  if (typeof window !== 'undefined' && window.location) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');

      if (tabParam === 'mock') {
        return {
          id: 'mock-tab-id',
          url: 'https://example.com',
          title: 'E2E Test Mock Tab',
          active: true,
          lastAccessed: Date.now()
        };
      }

      if (tabParam) {
        const tabId = parseInt(tabParam, 10);

        if (!isNaN(tabId)) {
          return await browser.tabs.get(tabId);
        }
      }
    } catch {
      // URL params not available (e.g., background script context)
    }
  }

  return null;
};

/**
* Get the last active tab.
* @async
* @param {Function} onCatch - Function to run if no tabs are found.
* @param {Function} filter - Function to filter the tabs.
* @return {Object} - The last active tab.
*/
const getLastActiveTab = async (onCatch, filter = null) => {
  // DEV-only: Check for test override first
  if (isDev) {
    const overrideTab = await getDevTabOverride();

    if (overrideTab) {
      if (filter && !filter(overrideTab)) {
        if (onCatch && typeof onCatch === 'function') {
          onCatch();
        }

        return false;
      }

      return overrideTab;
    }
  }

  let tabs = null;
  let lastFocusedWindow = null;

  if (import.meta.env.BROWSER !== 'firefox') {
    try {
      lastFocusedWindow = await browser.windows.getLastFocused({ windowTypes: ['normal'] });
    } catch {}
  }

  try {
    if (import.meta.env.BROWSER !== 'firefox' && lastFocusedWindow?.id) {
      tabs = await browser.tabs.query({ active: true, windowId: lastFocusedWindow.id });
    } else {
      tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true, windowType: 'normal' });
    }
  } catch {
    tabs = null;
  }

  if (filter && tabs) {
    tabs = tabs.filter(filter);
  }

  if (!tabs || tabs.length <= 0) {
    try {
      tabs = await browser.tabs.query({ active: true, windowType: 'normal' });
    } catch {
      tabs = null;
    }
  }

  if (filter && tabs) {
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
