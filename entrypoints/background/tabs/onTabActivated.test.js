// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// prompt.js used to be injected only by onTabUpdated, and only when the tab was
// already active at status 'complete'. A tab that finished loading in the background
// (Cmd/Ctrl+click, middle click) never got it, so no save prompt appeared there until
// the next navigation. onTabActivated must inject it when such a tab is activated.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../utils', () => ({
  sendDomainToPopupWindow: vi.fn(async () => {}),
  setBadgeLocked: vi.fn(async () => {}),
  setBadgeIcon: vi.fn(async () => {}),
  setBadgeText: vi.fn(async () => {})
}));

vi.mock('./isTabIsPopupWindow', () => ({ default: vi.fn(async () => false) }));
vi.mock('../contextMenu/updateNoAccountItem', () => ({ default: vi.fn(async () => {}) }));
vi.mock('@/partials/contentScript/checkPromptCS', () => ({ default: vi.fn(async () => {}) }));
vi.mock('@/partials/sessionStorage/getItems', () => ({ default: vi.fn(async () => []) }));
vi.mock('@/partials/sessionStorage/configured/getConfiguredBoolean', () => ({ default: vi.fn(async () => true) }));

import onTabActivated from './onTabActivated.js';
import checkPromptCS from '@/partials/contentScript/checkPromptCS';
import isTabIsPopupWindow from './isTabIsPopupWindow';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

const mockTab = tab => {
  vi.spyOn(browser.tabs, 'get').mockResolvedValue({ id: 42, active: true, status: 'complete', url: 'https://example.com/login', ...tab });
};

describe('onTabActivated — prompt.js for tabs loaded in the background', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('injects the prompt content script into an activated, fully loaded page', async () => {
    mockTab();

    await onTabActivated({ tabId: 42 });

    expect(checkPromptCS).toHaveBeenCalledWith(42);
  });

  it('leaves a still-loading tab to onTabUpdated (it is active at status complete)', async () => {
    mockTab({ status: 'loading' });

    await onTabActivated({ tabId: 42 });

    expect(checkPromptCS).not.toHaveBeenCalled();
  });

  it('does not inject into browser internal pages', async () => {
    mockTab({ url: 'chrome://extensions/' });

    await onTabActivated({ tabId: 42 });

    expect(checkPromptCS).not.toHaveBeenCalled();
  });

  it('does not inject into the extension popup window', async () => {
    mockTab();
    isTabIsPopupWindow.mockResolvedValueOnce(true);

    await onTabActivated({ tabId: 42 });

    expect(checkPromptCS).not.toHaveBeenCalled();
  });

  it('does not inject while the extension is not configured', async () => {
    mockTab();
    getConfiguredBoolean.mockResolvedValueOnce(false);

    await onTabActivated({ tabId: 42 });

    expect(checkPromptCS).not.toHaveBeenCalled();
  });

  it('does not inject into a discarded tab', async () => {
    mockTab({ discarded: true });

    await onTabActivated({ tabId: 42 });

    expect(checkPromptCS).not.toHaveBeenCalled();
  });

  it('still finishes the activation when the injection fails', async () => {
    mockTab();
    checkPromptCS.mockRejectedValueOnce(new Error('injection failed'));

    await expect(onTabActivated({ tabId: 42 })).resolves.toBe(true);
  });
});
