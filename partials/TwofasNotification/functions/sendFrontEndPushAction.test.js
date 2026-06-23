// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const injectCSIfNotAlready = vi.fn();

vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({
  default: (...args) => injectCSIfNotAlready(...args)
}));

import sendFrontEndPushAction from './sendFrontEndPushAction.js';

const NOTIFICATION = { Title: 'Error', Message: 'Failed to autofill. Please try again.' };

beforeEach(() => {
  vi.clearAllMocks();
  injectCSIfNotAlready.mockResolvedValue(true);
});

describe('sendFrontEndPushAction — delivery signal (finding #10)', () => {
  it('returns true when the content script receives the NOTIFICATION message', async () => {
    vi.spyOn(browser.tabs, 'sendMessage').mockResolvedValue(undefined);

    const result = await sendFrontEndPushAction(NOTIFICATION, 7, true);

    expect(result).toBe(true);
    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(7, expect.objectContaining({
      action: REQUEST_ACTIONS.NOTIFICATION,
      title: NOTIFICATION.Title,
      message: NOTIFICATION.Message,
      timeout: true,
      target: REQUEST_TARGETS.CONTENT
    }));
  });

  it('returns false when no content script is listening (sendMessage rejects)', async () => {
    vi.spyOn(browser.tabs, 'sendMessage').mockRejectedValue(new Error('Could not establish connection'));

    const result = await sendFrontEndPushAction(NOTIFICATION, 7, true);

    expect(result).toBe(false);
  });

  it('attempts to (re)inject the content script before sending', async () => {
    vi.spyOn(browser.tabs, 'sendMessage').mockResolvedValue(undefined);

    await sendFrontEndPushAction(NOTIFICATION, 7, true);

    expect(injectCSIfNotAlready).toHaveBeenCalledWith(7, REQUEST_TARGETS.CONTENT);
  });
});
