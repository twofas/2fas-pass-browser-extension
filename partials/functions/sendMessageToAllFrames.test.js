// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./filterInjectableFrames', () => ({
  default: frames => frames
}));

import sendMessageToAllFrames from './sendMessageToAllFrames.js';

describe('sendMessageToAllFrames — per-frame response normalization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(browser.webNavigation, 'getAllFrames').mockResolvedValue([
      { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
      { frameId: 1, parentFrameId: 0, url: 'https://example.com/inner' }
    ]);
  });

  // A frame whose content script acknowledges the message but never calls sendResponse
  // (e.g. the focus/prompt scripts returning false for a CONTENT-target AUTOFILL, with no
  // main content script in that frame) RESOLVES to undefined — it is not a rejection, so it
  // must be normalized here to the same false sentinel rejections use. Otherwise undefined
  // leaks into the response array and every caller that reads frameResponse.status throws.
  it('normalizes a frame that resolves to undefined into false', async () => {
    vi.spyOn(browser.tabs, 'sendMessage').mockImplementation((tabId, message, opts) =>
      opts.frameId === 0 ? Promise.resolve({ status: 'ok' }) : Promise.resolve(undefined)
    );

    const result = await sendMessageToAllFrames(5, { action: 'x' });

    expect(result).toEqual([{ status: 'ok' }, false]);
  });

  it('normalizes a frame that resolves to null into false', async () => {
    vi.spyOn(browser.tabs, 'sendMessage').mockImplementation((tabId, message, opts) =>
      opts.frameId === 0 ? Promise.resolve({ status: 'ok' }) : Promise.resolve(null)
    );

    const result = await sendMessageToAllFrames(5, { action: 'x' });

    expect(result).toEqual([{ status: 'ok' }, false]);
  });

  it('keeps a rejected frame as false and preserves object responses', async () => {
    vi.spyOn(browser.tabs, 'sendMessage').mockImplementation((tabId, message, opts) =>
      opts.frameId === 0 ? Promise.resolve({ status: 'ok' }) : Promise.reject(new Error('no receiver'))
    );

    const result = await sendMessageToAllFrames(5, { action: 'x' });

    expect(result).toEqual([{ status: 'ok' }, false]);
  });
});
