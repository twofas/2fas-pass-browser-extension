// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * E2E Test Context - DEV mode only.
 *
 * This module provides utilities for E2E testing the popup
 * by allowing programmatic control over tab context.
 *
 * Usage in E2E tests:
 * 1. URL param: popup.html?tab=123 (use real tab ID)
 * 2. URL param: popup.html?tab=mock (use default mock tab)
 * 3. Programmatic: setTestContext({ mockTab: {...} })
 */

import { setTestContext, clearTestContext } from '@/partials/functions';
import { mockTabs } from './mockTabs';

/**
 * Initialize E2E test context with a specific mock tab scenario.
 * @param {string} scenario - One of: 'standard', 'loginForm', 'cardForm', 'internal', 'noInputs', 'localhost'.
 */
export const initTestContext = scenario => {
  const mockTab = mockTabs[scenario];

  if (!mockTab) {
    throw new Error(`Unknown test scenario: ${scenario}. Available: ${Object.keys(mockTabs).join(', ')}`);
  }

  setTestContext({ mockTab });
};

/**
 * Initialize E2E test context with a real tab ID.
 * @param {number} tabId - Real browser tab ID.
 */
export const initTestContextWithTabId = tabId => {
  setTestContext({ tabId });
};

/**
 * Initialize E2E test context with a custom mock tab.
 * @param {Object} mockTab - Custom mock tab object.
 */
export const initTestContextWithMockTab = mockTab => {
  setTestContext({ mockTab });
};

/**
 * Reset test context to normal operation.
 */
export const resetTestContext = () => {
  clearTestContext();
};

export { mockTabs };
