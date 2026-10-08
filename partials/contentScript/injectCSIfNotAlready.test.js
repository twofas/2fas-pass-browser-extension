// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Measured on workspace.google.com: webNavigation.getAllFrames also returned Chrome's omnibox
// search prerender (google.com/search/warmup.html, documentLifecycle 'prerender'). It never
// answers CONTENT_SCRIPT_CHECK and executeScript never reaches it, so the verification count
// was never met: every cold call re-injected content.js into all frames and ran the polling
// loop, even though the content script was already alive (AddNew Login: ~380 ms vs ~15 ms).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import injectCSIfNotAlready from './injectCSIfNotAlready.js';

const top = { frameId: 0, parentFrameId: -1, frameType: 'outermost_frame', documentLifecycle: 'active', url: 'https://workspace.google.com/products/meet/' };
const sub = { frameId: 6, parentFrameId: 0, frameType: 'sub_frame', documentLifecycle: 'active', url: 'https://workspace.google.com/js/components/utils/cookie-sharing.html' };
const prerender = { frameId: 5, parentFrameId: -1, frameType: 'outermost_frame', documentLifecycle: 'prerender', url: 'https://www.google.com/search/warmup.html' };

describe('injectCSIfNotAlready', () => {
  let originalWebNavigation;
  let originalScripting;
  let executeScript;
  let tabId = 1000;

  beforeEach(() => {
    tabId++;
    executeScript = vi.fn(async () => []);
    originalWebNavigation = browser.webNavigation;
    originalScripting = browser.scripting;
    browser.webNavigation = { getAllFrames: vi.fn(async () => [top, sub, prerender]) };
    browser.scripting = { executeScript };
  });

  afterEach(() => {
    browser.webNavigation = originalWebNavigation;
    browser.scripting = originalScripting;
    vi.restoreAllMocks();
  });

  it('does not re-inject when only a prerendered document stays silent', async () => {
    vi.spyOn(browser.tabs, 'sendMessage').mockImplementation(async (id, message, { frameId }) => (frameId === prerender.frameId ? undefined : { status: 'ok' }));

    await expect(injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT)).resolves.toBe(true);
    expect(executeScript).not.toHaveBeenCalled();
  });

  it('never messages a prerendered document', async () => {
    const sendMessage = vi.spyOn(browser.tabs, 'sendMessage').mockImplementation(async () => ({ status: 'ok' }));

    await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);

    expect(sendMessage.mock.calls.map(([, , options]) => options.frameId)).not.toContain(prerender.frameId);
  });
});
