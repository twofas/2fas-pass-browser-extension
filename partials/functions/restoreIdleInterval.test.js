// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Regression (Brave 1.8.12 logs, 2026-10-21): after an extension restart without runtime.onStartup or
// runtime.onInstalled (crash recovery, reload), nothing set the idle detection interval again, so Chrome's
// 60-second default applied and a 60-minute idle lock cleared the session after a minute of inactivity.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const catchError = vi.fn();
vi.mock('@/utils/CatchError.js', () => ({ default: (...args) => catchError(...args) }));

import restoreIdleInterval from './restoreIdleInterval.js';

beforeEach(async () => {
  vi.clearAllMocks();
  browser.idle.setDetectionInterval = vi.fn();
  await storage.removeItem('local:autoIdleLock');
});

describe('restoreIdleInterval', () => {
  it('applies the stored idle lock in seconds', async () => {
    await storage.setItem('local:autoIdleLock', 60);

    await restoreIdleInterval();

    expect(browser.idle.setDetectionInterval).toHaveBeenCalledWith(3600);
  });

  it('applies the default interval for the "only on restart" choice', async () => {
    await storage.setItem('local:autoIdleLock', 'default');

    await restoreIdleInterval();

    expect(browser.idle.setDetectionInterval).toHaveBeenCalledWith(config.defaultStorageIdleLock * 60);
  });

  it('applies the default interval when no idle lock is stored', async () => {
    await restoreIdleInterval();

    expect(browser.idle.setDetectionInterval).toHaveBeenCalledWith(config.defaultStorageIdleLock * 60);
  });

  it('reports a storage failure instead of throwing', async () => {
    const error = new Error('storage unavailable');
    const getItem = vi.spyOn(storage, 'getItem').mockRejectedValueOnce(error);

    await expect(restoreIdleInterval()).resolves.toBeUndefined();
    expect(catchError).toHaveBeenCalledWith(error);
    expect(browser.idle.setDetectionInterval).not.toHaveBeenCalled();

    getItem.mockRestore();
  });
});
