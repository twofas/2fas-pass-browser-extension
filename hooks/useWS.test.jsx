// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// The hook's mount-time WS_GET_STATE query destructively consumes pendingUpdates.toasts
// on the background side, so they must be forwarded to showToast here or they are lost.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const showToastMock = vi.fn();

vi.mock('@/utils/showToast.js', () => ({ default: (...args) => showToastMock(...args) }));

describe('useWS', () => {
  beforeEach(() => {
    showToastMock.mockClear();
    vi.spyOn(browser.runtime, 'sendMessage').mockResolvedValue({
      status: 'ok',
      state: { active: false, connectView: null },
      pendingUpdates: { toasts: [] }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queries WS_GET_STATE on mount and exposes the returned state', async () => {
    browser.runtime.sendMessage.mockResolvedValue({
      status: 'ok',
      state: { active: true, connectView: 'QrView' }
    });

    const { result, unmount } = renderHook(() => useWS());

    await vi.waitFor(() => {
      expect(result.current.wsActive).toBe(true);
    });

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      action: REQUEST_ACTIONS.WS_GET_STATE,
      target: REQUEST_TARGETS.BACKGROUND_WS
    });
    expect(result.current.connectView).toBe('QrView');

    unmount();
  });

  it('displays pendingUpdates.toasts via showToast, using toastId when present', async () => {
    browser.runtime.sendMessage.mockResolvedValue({
      status: 'ok',
      state: { active: true, connectView: null },
      pendingUpdates: {
        toasts: [
          { message: 'plain toast', type: 'info' },
          { message: 'deduped toast', type: 'success', autoClose: false, toastId: 'ws-toast-1' }
        ]
      }
    });

    const { unmount } = renderHook(() => useWS());

    await vi.waitFor(() => {
      expect(showToastMock).toHaveBeenCalledTimes(2);
    });

    expect(showToastMock).toHaveBeenNthCalledWith(1, 'plain toast', 'info', true);
    expect(showToastMock).toHaveBeenNthCalledWith(2, 'deduped toast', 'success', false, { toastId: 'ws-toast-1' });

    unmount();
  });

  it('does not toast when pendingUpdates is absent or empty', async () => {
    const { unmount } = renderHook(() => useWS());

    await vi.waitFor(() => {
      expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    });

    expect(showToastMock).not.toHaveBeenCalled();

    unmount();
  });
});
