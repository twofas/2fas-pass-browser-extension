// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import waitForTabInputData from './waitForTabInputData.js';

const TAB_ID = 7;
const sampleInputs = () => ({ someId: { id: 'someId', type: 'username', value: 'a', url: 'https://example.com' } });

describe('waitForTabInputData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('resolves immediately (true) when the tab already has captured inputs', async () => {
    const tabsInputData = { [TAB_ID]: sampleInputs() };
    await expect(waitForTabInputData(tabsInputData, TAB_ID, { maxWait: 600, step: 50 })).resolves.toBe(true);
  });

  it('resolves true once inputs arrive mid-wait (simulating the submit flush)', async () => {
    const tabsInputData = {}; // empty: simulates a worker restart that dropped the store

    const promise = waitForTabInputData(tabsInputData, TAB_ID, { maxWait: 600, step: 50 });

    // The flush / beacon repopulates the store partway through the wait window.
    await vi.advanceTimersByTimeAsync(120);
    tabsInputData[TAB_ID] = sampleInputs();
    await vi.advanceTimersByTimeAsync(60);

    await expect(promise).resolves.toBe(true);
  });

  it('resolves false when inputs never arrive within maxWait', async () => {
    const tabsInputData = {};

    const promise = waitForTabInputData(tabsInputData, TAB_ID, { maxWait: 200, step: 50 });
    await vi.advanceTimersByTimeAsync(250);

    await expect(promise).resolves.toBe(false);
  });

  it('treats an empty per-tab object as no data', async () => {
    const tabsInputData = { [TAB_ID]: {} };

    const promise = waitForTabInputData(tabsInputData, TAB_ID, { maxWait: 100, step: 50 });
    await vi.advanceTimersByTimeAsync(150);

    await expect(promise).resolves.toBe(false);
  });
});
