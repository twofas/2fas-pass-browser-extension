// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, afterEach } from 'vitest';
import isFirefoxBelow149 from './isFirefoxBelow149';

// browser.runtime.getBrowserInfo is a Firefox-only API and is not part of the
// WXT fake browser used in tests, so it is assigned directly on the shared
// browser.runtime object the helper reads from.
const setGetBrowserInfo = impl => {
  browser.runtime.getBrowserInfo = impl;
};

describe('isFirefoxBelow149', () => {
  afterEach(() => {
    delete browser.runtime.getBrowserInfo;
  });

  it('returns true for the minimum supported Firefox (142.0)', async () => {
    setGetBrowserInfo(vi.fn().mockResolvedValue({ version: '142.0' }));

    await expect(isFirefoxBelow149()).resolves.toBe(true);
  });

  it('returns true for the last affected version (148.0)', async () => {
    setGetBrowserInfo(vi.fn().mockResolvedValue({ version: '148.0' }));

    await expect(isFirefoxBelow149()).resolves.toBe(true);
  });

  it('returns true for a patch release below 149 (148.5.1)', async () => {
    setGetBrowserInfo(vi.fn().mockResolvedValue({ version: '148.5.1' }));

    await expect(isFirefoxBelow149()).resolves.toBe(true);
  });

  it('returns false for the first fixed version (149.0)', async () => {
    setGetBrowserInfo(vi.fn().mockResolvedValue({ version: '149.0' }));

    await expect(isFirefoxBelow149()).resolves.toBe(false);
  });

  it('returns false for a 149 pre-release (149.0a1)', async () => {
    setGetBrowserInfo(vi.fn().mockResolvedValue({ version: '149.0a1' }));

    await expect(isFirefoxBelow149()).resolves.toBe(false);
  });

  it('returns false for a version above 149 (150.0)', async () => {
    setGetBrowserInfo(vi.fn().mockResolvedValue({ version: '150.0' }));

    await expect(isFirefoxBelow149()).resolves.toBe(false);
  });

  it('returns false when getBrowserInfo rejects', async () => {
    setGetBrowserInfo(vi.fn().mockRejectedValue(new Error('not supported')));

    await expect(isFirefoxBelow149()).resolves.toBe(false);
  });

  it('returns false when the version is missing', async () => {
    setGetBrowserInfo(vi.fn().mockResolvedValue({}));

    await expect(isFirefoxBelow149()).resolves.toBe(false);
  });

  it('returns false when getBrowserInfo is unavailable (non-Firefox runtime)', async () => {
    delete browser.runtime.getBrowserInfo;

    await expect(isFirefoxBelow149()).resolves.toBe(false);
  });
});
