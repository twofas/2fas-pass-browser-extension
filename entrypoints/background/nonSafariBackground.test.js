// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

import nonSafariBackground from './nonSafariBackground.js';

beforeEach(async () => {
  vi.clearAllMocks();
  browser.idle.setDetectionInterval = vi.fn();
  browser.idle.onStateChanged.addListener = vi.fn();
  browser.runtime.onUpdateAvailable.addListener = vi.fn();
  await storage.removeItem('local:autoIdleLock');
});

describe('nonSafariBackground', () => {
  it('restores the stored idle lock on every background start, not only on onStartup or onInstalled', async () => {
    await storage.setItem('local:autoIdleLock', 60);

    nonSafariBackground();

    await vi.waitFor(() => {
      expect(browser.idle.setDetectionInterval).toHaveBeenCalledWith(3600);
    });
  });
});
