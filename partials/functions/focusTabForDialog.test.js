// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, afterEach } from 'vitest';

import focusTabForDialog from './focusTabForDialog.js';

describe('focusTabForDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('focuses the window, activates the tab, then waits the configured delay', async () => {
    const tabsGet = vi.spyOn(browser.tabs, 'get').mockResolvedValue({ windowId: 42 });
    const windowsUpdate = vi.spyOn(browser.windows, 'update').mockResolvedValue(undefined);
    const tabsUpdate = vi.spyOn(browser.tabs, 'update').mockResolvedValue(undefined);
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(fn => {
      fn();

      return 0;
    });

    await focusTabForDialog(7);

    expect(tabsGet).toHaveBeenCalledWith(7);
    expect(windowsUpdate).toHaveBeenCalledWith(42, { focused: true });
    expect(tabsUpdate).toHaveBeenCalledWith(7, { active: true });
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), config.crossDomainDialogFocusDelay);
  });

  it('swallows errors when the tab can no longer be focused', async () => {
    vi.spyOn(browser.tabs, 'get').mockRejectedValue(new Error('No tab with id 99'));
    const windowsUpdate = vi.spyOn(browser.windows, 'update');

    await expect(focusTabForDialog(99)).resolves.toBeUndefined();
    expect(windowsUpdate).not.toHaveBeenCalled();
  });
});
