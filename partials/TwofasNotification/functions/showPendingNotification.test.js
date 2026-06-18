// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const showToastMock = vi.fn();

vi.mock('@/utils/showToast.js', () => ({ default: (...args) => showToastMock(...args) }));

import showPendingNotification from './showPendingNotification.js';

const KEY = 'session:notificationPending-42';

beforeEach(async () => {
  vi.clearAllMocks();
  await storage.removeItem(KEY);
  vi.spyOn(browser.tabs, 'query').mockResolvedValue([{ id: 42 }]);
});

describe('showPendingNotification (finding #10)', () => {
  it('shows the pending notification message as an error toast and clears it', async () => {
    await storage.setItem(KEY, JSON.stringify({ Title: 'Error', Message: 'Failed to autofill. Please try again.', timeout: true }));

    await showPendingNotification();

    expect(showToastMock).toHaveBeenCalledWith('Failed to autofill. Please try again.', 'error', undefined);
    expect(await storage.getItem(KEY)).toBeNull();
  });

  it('shows a persistent toast (autoClose=false) when timeout is false', async () => {
    await storage.setItem(KEY, JSON.stringify({ Title: 'Error', Message: 'Persistent message', timeout: false }));

    await showPendingNotification();

    expect(showToastMock).toHaveBeenCalledWith('Persistent message', 'error', false);
  });

  it('falls back to the Title when the Message is empty', async () => {
    await storage.setItem(KEY, JSON.stringify({ Title: 'Only title', Message: '', timeout: true }));

    await showPendingNotification();

    expect(showToastMock).toHaveBeenCalledWith('Only title', 'error', undefined);
  });

  it('does nothing when there is no pending notification', async () => {
    await showPendingNotification();

    expect(showToastMock).not.toHaveBeenCalled();
  });

  it('does nothing when there is no active tab', async () => {
    browser.tabs.query.mockResolvedValue([]);
    await storage.setItem(KEY, JSON.stringify({ Title: 'Error', Message: 'msg', timeout: true }));

    await showPendingNotification();

    expect(showToastMock).not.toHaveBeenCalled();
    // The stored item belongs to tab 42 and must remain untouched when no active tab resolves.
    expect(await storage.getItem(KEY)).not.toBeNull();
  });

  it('does not show a toast when the stored payload is malformed', async () => {
    await storage.setItem(KEY, 'not-json');

    await showPendingNotification();

    expect(showToastMock).not.toHaveBeenCalled();
    expect(await storage.getItem(KEY)).toBeNull();
  });
});
