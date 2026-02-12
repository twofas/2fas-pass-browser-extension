// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Mock tab definitions for E2E testing scenarios.
 * Each mock tab simulates a specific test scenario.
 */
export const mockTabs = Object.freeze({
  standard: {
    id: 99001,
    url: 'https://example.com/login',
    title: 'Example Login Page',
    active: true,
    lastAccessed: Date.now(),
    windowId: 1,
    index: 0,
    highlighted: true,
    incognito: false,
    pinned: false,
    status: 'complete'
  },

  loginForm: {
    id: 99002,
    url: 'https://accounts.google.com/signin',
    title: 'Sign in - Google Accounts',
    active: true,
    lastAccessed: Date.now(),
    windowId: 1,
    index: 0,
    highlighted: true,
    incognito: false,
    pinned: false,
    status: 'complete'
  },

  cardForm: {
    id: 99003,
    url: 'https://checkout.stripe.com/pay',
    title: 'Checkout - Stripe',
    active: true,
    lastAccessed: Date.now(),
    windowId: 1,
    index: 0,
    highlighted: true,
    incognito: false,
    pinned: false,
    status: 'complete'
  },

  internal: {
    id: 99004,
    url: 'chrome://extensions',
    title: 'Extensions',
    active: true,
    lastAccessed: Date.now(),
    windowId: 1,
    index: 0,
    highlighted: true,
    incognito: false,
    pinned: false,
    status: 'complete'
  },

  noInputs: {
    id: 99005,
    url: 'https://example.com/about',
    title: 'About Us',
    active: true,
    lastAccessed: Date.now(),
    windowId: 1,
    index: 0,
    highlighted: true,
    incognito: false,
    pinned: false,
    status: 'complete'
  },

  localhost: {
    id: 99006,
    url: 'http://localhost:3000/login',
    title: 'Dev Server Login',
    active: true,
    lastAccessed: Date.now(),
    windowId: 1,
    index: 0,
    highlighted: true,
    incognito: false,
    pinned: false,
    status: 'complete'
  }
});

/**
 * Create a custom mock tab with override values.
 * @param {Object} overrides - Properties to override from base tab.
 * @return {Object} Mock tab object.
 */
export const createMockTab = (overrides = {}) => ({
  id: 99999,
  url: 'https://example.com',
  title: 'Custom Mock Tab',
  active: true,
  lastAccessed: Date.now(),
  windowId: 1,
  index: 0,
  highlighted: true,
  incognito: false,
  pinned: false,
  status: 'complete',
  ...overrides
});
