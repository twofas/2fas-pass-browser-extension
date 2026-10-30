// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('@/partials/functions/popupIsInSeparateWindow', () => ({ default: vi.fn() }));
vi.mock('@/partials/functions/getPopupWindowData', () => ({ default: vi.fn() }));

import CatchError from '@/utils/CatchError.js';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import getPopupWindowData from '@/partials/functions/getPopupWindowData';
import openPopupWindowInNewWindow from './openPopupWindowInNewWindow.js';

const POPUP_SIZE = { height: 639, width: 416 };
const CURRENT_WINDOW = { height: 1000, left: 0, top: 0, width: 1600 };

beforeEach(() => {
  vi.clearAllMocks();
  browser.windows.getCurrent = vi.fn(async () => CURRENT_WINDOW);
  browser.windows.create = vi.fn(async () => ({ id: 7 }));
  browser.windows.update = vi.fn(async () => ({}));
  browser.windows.get = vi.fn(async () => ({ id: 7, state: 'normal', type: 'popup', ...POPUP_SIZE }));
  browser.tabs.update = vi.fn(async () => ({}));
});

describe('openPopupWindowInNewWindow — new window', () => {
  beforeEach(() => {
    popupIsInSeparateWindow.mockResolvedValue(false);
  });

  it('creates a centered popup window of the popup size', async () => {
    await openPopupWindowInNewWindow({ pathname: '/fetch/x' });

    expect(browser.windows.create).toHaveBeenCalledWith(expect.objectContaining({
      ...POPUP_SIZE,
      left: 592,
      top: 181,
      type: 'popup',
      url: 'popup.html#/fetch/x?newWindow'
    }));
  });

  it('takes a full-screen popup window out of full screen, then gives it the popup size and position', async () => {
    browser.windows.get = vi.fn(async () => ({ height: 1964, id: 7, state: 'fullscreen', type: 'popup', width: 3024 }));

    await openPopupWindowInNewWindow({ pathname: '/fetch/x' });

    expect(browser.windows.update).toHaveBeenNthCalledWith(1, 7, { state: 'normal' });
    expect(browser.windows.update).toHaveBeenNthCalledWith(2, 7, { ...POPUP_SIZE, left: 592, top: 181 });
  });

  it('does not change a popup window that is not full screen', async () => {
    await openPopupWindowInNewWindow({ pathname: '/fetch/x' });

    expect(browser.windows.update).not.toHaveBeenCalled();
  });

  it('reports an error when the browser refuses to leave full screen', async () => {
    browser.windows.get = vi.fn(async () => ({ height: 1964, id: 7, state: 'fullscreen', type: 'popup', width: 3024 }));
    browser.windows.update = vi.fn(async () => {
      throw new Error('not supported');
    });

    await expect(openPopupWindowInNewWindow({ pathname: '/fetch/x' })).resolves.toBeUndefined();
    expect(CatchError).toHaveBeenCalled();
  });

  it('does not check the window state when the window could not be created', async () => {
    browser.windows.create = vi.fn(async () => {
      throw new Error('failed');
    });

    await openPopupWindowInNewWindow({ pathname: '/fetch/x' });

    expect(browser.windows.get).not.toHaveBeenCalled();
    expect(browser.windows.update).not.toHaveBeenCalled();
  });
});

describe('openPopupWindowInNewWindow — reused popup window', () => {
  beforeEach(() => {
    popupIsInSeparateWindow.mockResolvedValue(true);
    getPopupWindowData.mockResolvedValue({ id: 3, windowId: 9 });
  });

  it('navigates and focuses the existing popup window, keeping the size the user chose', async () => {
    await openPopupWindowInNewWindow({ pathname: '/fetch/x' });

    expect(browser.tabs.update).toHaveBeenCalledWith(3, { url: 'popup.html#/fetch/x?newWindow' });
    expect(browser.windows.update).toHaveBeenCalledTimes(1);
    expect(browser.windows.update).toHaveBeenCalledWith(9, { focused: true });
    expect(browser.windows.create).not.toHaveBeenCalled();
    expect(browser.windows.get).not.toHaveBeenCalled();
  });
});
