// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// The hook is the auxiliary liveness leg for session views (PushSent, Fetch): while enabled
// it polls WS_GET_STATE every 10s, which both wakes the background SW and delivers any
// pendingUpdates.toasts (consumed on read — lost if not shown here).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const showToastMock = vi.fn();

vi.mock('@/utils/showToast.js', () => ({ default: (...args) => showToastMock(...args) }));

describe('useWsLiveness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    showToastMock.mockClear();
    vi.spyOn(browser.runtime, 'sendMessage').mockResolvedValue({
      status: 'ok',
      state: {},
      pendingUpdates: { toasts: [] }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('polls WS_GET_STATE immediately and every 10s while enabled', async () => {
    const { unmount } = renderHook(() => useWsLiveness(true));

    await vi.waitFor(() => {
      expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    });

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      action: REQUEST_ACTIONS.WS_GET_STATE,
      target: REQUEST_TARGETS.BACKGROUND_WS
    });

    await vi.advanceTimersByTimeAsync(10000);
    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(10000);
    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(3);

    unmount();
  });

  it('does not poll when disabled', async () => {
    renderHook(() => useWsLiveness(false));

    await vi.advanceTimersByTimeAsync(30000);

    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('stops polling once disabled and on unmount', async () => {
    const { rerender, unmount } = renderHook(({ enabled }) => useWsLiveness(enabled), {
      initialProps: { enabled: true }
    });

    await vi.waitFor(() => {
      expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    });

    rerender({ enabled: false });
    browser.runtime.sendMessage.mockClear();

    await vi.advanceTimersByTimeAsync(30000);
    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();

    unmount();
  });

  it('displays pendingUpdates.toasts via showToast, using toastId when present', async () => {
    browser.runtime.sendMessage.mockResolvedValue({
      status: 'ok',
      state: {},
      pendingUpdates: {
        toasts: [
          { message: 'plain toast', type: 'info' },
          { message: 'deduped toast', type: 'success', autoClose: false, toastId: 'ws-toast-1' }
        ]
      }
    });

    const { unmount } = renderHook(() => useWsLiveness(true));

    await vi.waitFor(() => {
      expect(showToastMock).toHaveBeenCalledTimes(2);
    });

    expect(showToastMock).toHaveBeenNthCalledWith(1, 'plain toast', 'info', true);
    expect(showToastMock).toHaveBeenNthCalledWith(2, 'deduped toast', 'success', false, { toastId: 'ws-toast-1' });

    unmount();
  });
});
