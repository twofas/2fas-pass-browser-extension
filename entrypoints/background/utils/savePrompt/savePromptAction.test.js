// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../sendSavePromptToTab', () => ({ default: vi.fn(async () => true) }));
vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({ default: vi.fn(async () => {}) }));

import savePromptAction from './savePromptAction';
import sendSavePromptToTab from '../sendSavePromptToTab';

describe('savePromptAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ id: 9, status: 'complete', url: 'https://example.com/login' });
    browser.tabs.getCurrent = vi.fn(async () => undefined);
  });

  it('marks the queued action as displayed when the page showed the prompt', async () => {
    const actions = [{ tabId: 9, url: 'https://example.com' }];

    await savePromptAction({ tabId: 9, initiator: 'https://example.com' }, { type: 'newService' }, {}, { username: 'u', password: 'p' }, actions);

    expect(typeof actions[0].displayedAt).toBe('number');
  });

  it('does not mark the action when no frame showed the prompt', async () => {
    sendSavePromptToTab.mockResolvedValueOnce(false);
    const actions = [{ tabId: 9, url: 'https://example.com' }];

    await savePromptAction({ tabId: 9, initiator: 'https://example.com' }, { type: 'newService' }, {}, { username: 'u', password: 'p' }, actions);

    expect(actions[0].displayedAt).toBeUndefined();
  });

  it('shows the prompt soon after the page has finished loading', async () => {
    vi.useFakeTimers();
    browser.tabs.get
      .mockResolvedValueOnce({ id: 9, status: 'loading', url: 'https://example.com/login' })
      .mockResolvedValue({ id: 9, status: 'complete', url: 'https://example.com/login' });

    const done = savePromptAction({ tabId: 9, initiator: 'https://example.com' }, { type: 'newService' }, {}, { username: 'u', password: 'p' }, []);

    await vi.advanceTimersByTimeAsync(30);

    expect(sendSavePromptToTab).toHaveBeenCalledTimes(1);

    await done;
    vi.useRealTimers();
  });

  it('keeps the values the next page captured after the login request (login re-rendered with a pre-filled username)', async () => {
    const requestTime = 1_800_000_000_000;
    const tabsInputData = {
      9: {
        sent: { id: 'sent', type: 'password', value: 'p', timestamp: requestTime - 500 },
        next: { id: 'next', type: 'username', value: 'u', timestamp: requestTime + 300 }
      }
    };

    await savePromptAction({ tabId: 9, initiator: 'https://example.com', timeStamp: requestTime }, { type: 'newService' }, tabsInputData, { username: 'u', password: 'p' }, []);

    expect(Object.keys(tabsInputData[9])).toEqual(['next']);
  });

  it('clears all values of the tab when the request time is unknown', async () => {
    const tabsInputData = { 9: { a: { id: 'a', type: 'username', value: 'u', timestamp: Date.now() } } };

    await savePromptAction({ tabId: 9, initiator: 'https://example.com' }, { type: 'newService' }, tabsInputData, { username: 'u', password: 'p' }, []);

    expect(tabsInputData[9]).toEqual({});
  });
});

