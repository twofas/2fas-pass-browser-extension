// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';
import isSavePromptSenderEligible from './isSavePromptSenderEligible.js';

describe('isSavePromptSenderEligible', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for the top frame without any browser lookup', async () => {
    const tabsGet = vi.spyOn(browser.tabs, 'get');
    expect(await isSavePromptSenderEligible({ frameId: 0, tab: { id: 7 }, url: 'https://example.com/' })).toBe(true);
    expect(tabsGet).not.toHaveBeenCalled();
  });

  it('returns false when there is no tab id', async () => {
    expect(await isSavePromptSenderEligible({ frameId: 1, url: 'https://example.com/' })).toBe(false);
  });

  it('returns true for a same-root-domain http(s) sub-frame', async () => {
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ url: 'https://www.example.com/' });
    const sender = { frameId: 2, tab: { id: 7 }, url: 'https://login.example.com/' };
    expect(await isSavePromptSenderEligible(sender)).toBe(true);
  });

  it('returns false for a cross-root-domain http(s) sub-frame', async () => {
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ url: 'https://example.com/' });
    const sender = { frameId: 2, tab: { id: 7 }, url: 'https://accounts.google.com/' };
    expect(await isSavePromptSenderEligible(sender)).toBe(false);
  });

  it('returns false when the tab url cannot be read', async () => {
    vi.spyOn(browser.tabs, 'get').mockRejectedValue(new Error('no tab'));
    const sender = { frameId: 2, tab: { id: 7 }, url: 'https://example.com/' };
    expect(await isSavePromptSenderEligible(sender)).toBe(false);
  });

  it('treats about:blank / about:srcdoc sub-frames as ineligible (fail-closed)', async () => {
    // Opaque-origin frames tag captured inputs with location.origin "null", which can
    // never be matched downstream, so eligibility is uniformly denied (matches the
    // webRequest frame gate). No webNavigation lookup is attempted.
    const getAllFrames = vi.spyOn(browser.webNavigation, 'getAllFrames');
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ url: 'https://example.com/' });
    expect(await isSavePromptSenderEligible({ frameId: 3, tab: { id: 7 }, url: 'about:blank' })).toBe(false);
    expect(await isSavePromptSenderEligible({ frameId: 4, tab: { id: 7 }, url: 'about:srcdoc' })).toBe(false);
    expect(getAllFrames).not.toHaveBeenCalled();
  });
});
