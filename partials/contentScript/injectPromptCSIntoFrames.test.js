// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// prompt.js used to be injected with injectCSIfNotAlready (allFrames: true). Its check
// expects every injectable frame to answer, but prompt.js in a cross-root-domain frame
// exits before listening and a freshly navigated iframe has no prompt.js at all. Every
// tab 'complete' fired by an iframe navigation (ads, captchas, embeds) therefore
// re-executed prompt.js in all frames, the top frame included, leaving a stale instance
// holding captured values behind each time. prompt.js must be injected only into the
// frames that can capture (top + same-root-domain frames, as isSavePromptSenderEligible)
// and only where it is missing.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import injectPromptCSIntoFrames, { getPromptFrames } from './injectPromptCSIntoFrames.js';

const TAB_ID = 3;
const top = { frameId: 0, parentFrameId: -1, url: 'https://www.example.com/login' };
const sameSite = { frameId: 4, parentFrameId: 0, url: 'https://auth.example.com/embed' };
const crossSite = { frameId: 7, parentFrameId: 0, url: 'https://www.google.com/recaptcha/api2/anchor' };
const blank = { frameId: 9, parentFrameId: 0, url: 'about:blank' };

describe('getPromptFrames', () => {
  it('keeps the top frame and same-root-domain frames only', () => {
    expect(getPromptFrames([top, sameSite, crossSite, blank]).map(frame => frame.frameId)).toEqual([0, 4]);
  });

  it('returns nothing without an http(s) top frame', () => {
    expect(getPromptFrames([{ frameId: 0, parentFrameId: -1, url: 'chrome://newtab/' }, sameSite])).toEqual([]);
    expect(getPromptFrames([])).toEqual([]);
  });
});

describe('injectPromptCSIntoFrames', () => {
  let originalWebNavigation;
  let originalScripting;
  let getAllFrames;
  let executeScript;
  let present;

  beforeEach(() => {
    present = new Set();
    getAllFrames = vi.fn(async () => [top, sameSite, crossSite, blank]);
    executeScript = vi.fn(async () => []);
    originalWebNavigation = browser.webNavigation;
    originalScripting = browser.scripting;
    browser.webNavigation = { getAllFrames };
    browser.scripting = { executeScript };
    vi.spyOn(browser.tabs, 'sendMessage').mockImplementation(async (tabId, message, { frameId }) => (present.has(frameId) ? { status: 'ok' } : undefined));
  });

  afterEach(() => {
    browser.webNavigation = originalWebNavigation;
    browser.scripting = originalScripting;
    vi.restoreAllMocks();
  });

  const injectedFrameIds = () => executeScript.mock.calls.map(([options]) => options.target.frameIds).flat();

  it('injects into the top and same-site frames of a fresh page, never into cross-site frames', async () => {
    await expect(injectPromptCSIntoFrames(TAB_ID)).resolves.toBe(true);

    expect(injectedFrameIds().sort()).toEqual([0, 4]);
    expect(executeScript).toHaveBeenCalledWith({ target: { tabId: TAB_ID, frameIds: [0] }, files: ['content-scripts/prompt.js'], injectImmediately: true });
  });

  it('does not inject again when every frame that needs prompt.js has it (cross-site frames stay silent)', async () => {
    present = new Set([0, 4]);

    await expect(injectPromptCSIntoFrames(TAB_ID)).resolves.toBe(true);

    expect(executeScript).not.toHaveBeenCalled();
  });

  it('injects only into a same-site frame that navigated, not into the top frame again', async () => {
    present = new Set([0]);

    await injectPromptCSIntoFrames(TAB_ID);

    expect(injectedFrameIds()).toEqual([4]);
  });

  it('asks only the frames that need prompt.js', async () => {
    present = new Set([0, 4]);

    await injectPromptCSIntoFrames(TAB_ID);

    expect(browser.tabs.sendMessage.mock.calls.map(([, message, options]) => [message, options.frameId])).toEqual([
      [{ action: REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK, target: REQUEST_TARGETS.PROMPT }, 0],
      [{ action: REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK, target: REQUEST_TARGETS.PROMPT }, 4]
    ]);
  });

  it('keeps injecting into the other frames when one frame is gone', async () => {
    executeScript.mockImplementation(async ({ target }) => {
      if (target.frameIds[0] === 4) {
        throw new Error('No frame with id 4 in tab 3.');
      }

      return [];
    });

    await expect(injectPromptCSIntoFrames(TAB_ID)).resolves.toBe(true);
    expect(injectedFrameIds().sort()).toEqual([0, 4]);
  });

  it('reports failure when the top frame cannot be injected', async () => {
    executeScript.mockRejectedValue(new Error('Cannot access contents of the page.'));

    await expect(injectPromptCSIntoFrames(TAB_ID)).resolves.toBe(false);
  });

  it('does nothing when the frames cannot be read', async () => {
    getAllFrames.mockRejectedValue(new Error('No tab with id: 3.'));

    await expect(injectPromptCSIntoFrames(TAB_ID)).resolves.toBe(false);
    expect(executeScript).not.toHaveBeenCalled();
  });

  it('does nothing on a page without an http(s) top frame', async () => {
    getAllFrames.mockResolvedValue([{ frameId: 0, parentFrameId: -1, url: 'chrome://extensions/' }]);

    await expect(injectPromptCSIntoFrames(TAB_ID)).resolves.toBe(false);
    expect(executeScript).not.toHaveBeenCalled();
  });
});
