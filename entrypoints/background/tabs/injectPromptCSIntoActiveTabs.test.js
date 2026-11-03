// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Pages loaded while the vault was locked get no prompt.js (onTabUpdated and onTabActivated stop at the lock). After
// unlocking, the tab the user is looking at must get it at once, without a reload or a tab switch.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/partials/contentScript/checkPromptCS', () => ({ default: vi.fn(async () => {}) }));

import injectPromptCSIntoActiveTabs from './injectPromptCSIntoActiveTabs';
import checkPromptCS from '@/partials/contentScript/checkPromptCS';

describe('injectPromptCSIntoActiveTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('injects prompt.js into the loaded web page active in each window', async () => {
    vi.spyOn(browser.tabs, 'query').mockResolvedValue([
      { id: 1, active: true, status: 'complete', url: 'https://example.com/login' },
      { id: 2, active: true, status: 'complete', url: 'https://shop.example.org/' }
    ]);

    await injectPromptCSIntoActiveTabs();

    expect(browser.tabs.query).toHaveBeenCalledWith({ active: true });
    expect(checkPromptCS.mock.calls.map(([tabId]) => tabId)).toEqual([1, 2]);
  });

  it('skips internal, extension, discarded and still loading tabs', async () => {
    vi.spyOn(browser.tabs, 'query').mockResolvedValue([
      { id: 1, active: true, status: 'complete', url: 'chrome://settings/' },
      { id: 2, active: true, status: 'complete', url: `chrome-extension://${browser.runtime.id}/popup.html` },
      { id: 3, active: true, status: 'complete', url: 'https://example.com/', discarded: true },
      { id: 4, active: true, status: 'loading', url: 'https://example.com/' }
    ]);

    await injectPromptCSIntoActiveTabs();

    expect(checkPromptCS).not.toHaveBeenCalled();
  });

  it('does not throw when the tabs cannot be read', async () => {
    vi.spyOn(browser.tabs, 'query').mockRejectedValue(new Error('no tabs'));

    await expect(injectPromptCSIntoActiveTabs()).resolves.toBeUndefined();
  });
});
