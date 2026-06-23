// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Spec-first tests for the last-active-tab resolver (finding #42).
//
// The multi-window fallback query (`tabs.query({ active: true, windowType: 'normal' })`)
// returns the active tab of EVERY normal window, so the resolver must pick the most
// recently used one. Safari does not support tabs.Tab.lastAccessed (BCD
// version_added:false), so the `b.lastAccessed - a.lastAccessed` comparator yields NaN
// and the sort is a silent no-op there — leaving multi-window order undefined. The fix
// prefers the active tab of the last focused window (resolved via windows.getLastFocused,
// which Safari does support) and only sorts when lastAccessed is a real number.
//
// Default test BROWSER is 'chrome' (non-firefox), so the windows.getLastFocused path runs.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import getLastActiveTab, { clearTestContext } from './getLastActiveTab.js';

const tab = (id, windowId, lastAccessed) => {
  const t = { id, windowId, url: `https://example.com/${id}`, active: true };

  if (lastAccessed !== undefined) {
    t.lastAccessed = lastAccessed;
  }

  return t;
};

// Routes browser.tabs.query by the shape of the query object: a windowId-scoped query is
// the primary path, anything else is the multi-window fallback.
const routeQuery = ({ primary, fallback }) => query => {
  if (query?.windowId !== undefined) {
    return Promise.resolve(primary);
  }

  return Promise.resolve(fallback);
};

beforeEach(() => {
  clearTestContext();
  vi.restoreAllMocks();

  if (!browser.windows) {
    browser.windows = {};
  }

  browser.windows.getLastFocused = vi.fn().mockResolvedValue({ id: 10, type: 'normal' });
  browser.tabs.query = vi.fn();
});

describe('getLastActiveTab — finding #42 (Safari lastAccessed no-op)', () => {
  it('Safari multi-window fallback: returns the active tab of the last focused window, not the query-order first tab', async () => {
    // Primary windowId-scoped query misses (e.g. transient race on SW wake), forcing the fallback.
    // Fallback returns the active tab of every normal window with NO lastAccessed (Safari), and the
    // focused window's tab (id 100, windowId 10) is NOT first in query order.
    browser.tabs.query.mockImplementation(routeQuery({
      primary: [],
      fallback: [tab(200, 20), tab(100, 10)]
    }));

    const result = await getLastActiveTab();

    expect(result).toBeTruthy();
    expect(result.id).toBe(100);
  });

  it('falls back to recency sort when lastAccessed IS a number and no focused-window tab is present', async () => {
    // No identifiable focused window → sort path. Out-of-order lastAccessed must be ordered desc.
    browser.windows.getLastFocused.mockRejectedValue(new Error('no window'));
    browser.tabs.query.mockImplementation(routeQuery({
      primary: [],
      fallback: [tab(1, 20, 100), tab(2, 30, 500), tab(3, 40, 300)]
    }));

    const result = await getLastActiveTab();

    expect(result.id).toBe(2);
  });

  it('does not throw and returns a tab when lastAccessed is missing and no focused-window match exists', async () => {
    browser.windows.getLastFocused.mockRejectedValue(new Error('no window'));
    browser.tabs.query.mockImplementation(routeQuery({
      primary: [],
      fallback: [tab(7, 20), tab(8, 30)]
    }));

    const result = await getLastActiveTab();

    expect(result).toBeTruthy();
    expect([7, 8]).toContain(result.id);
  });

  it('primary path: returns the active tab of the focused window directly', async () => {
    browser.tabs.query.mockImplementation(routeQuery({
      primary: [tab(50, 10, 999)],
      fallback: []
    }));

    const result = await getLastActiveTab();

    expect(result.id).toBe(50);
  });

  it('applies the filter and prefers a filtered focused-window tab in the fallback', async () => {
    // Primary returns the focused window's active tab but it fails the filter, so the fallback runs.
    // The fallback (already filtered) still contains another acceptable focused-window tab.
    browser.tabs.query.mockImplementation(routeQuery({
      primary: [tab(99, 10)],
      fallback: [tab(200, 20), tab(101, 10)]
    }));

    const filter = t => t.id !== 99;
    const result = await getLastActiveTab(null, filter);

    expect(result.id).toBe(101);
  });

  it('calls onCatch and returns false when no tabs are found anywhere', async () => {
    browser.tabs.query.mockImplementation(routeQuery({ primary: [], fallback: [] }));
    const onCatch = vi.fn();

    const result = await getLastActiveTab(onCatch);

    expect(onCatch).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
  });
});
