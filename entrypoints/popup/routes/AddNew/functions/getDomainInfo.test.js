// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// The password rules used to be read by injecting the whole content.js into every frame
// (injectCSIfNotAlready with its verification loop) and messaging all frames with
// GET_DOMAIN_INFO. One scripting.executeScript call in the top frame does the same read.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({ default: vi.fn() }));
vi.mock('@/partials/functions/sendMessageToAllFrames', () => ({ default: vi.fn() }));

import getDomainInfo from './getDomainInfo';
import readPasswordRules from './readPasswordRules';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';

const EMPTY_RULES = { minLength: null, maxLength: null, pattern: null };
const TAB = { id: 7, url: 'https://example.com/' };

describe('getDomainInfo', () => {
  let originalScripting;
  let executeScript;

  beforeEach(() => {
    executeScript = vi.fn();
    originalScripting = browser.scripting;
    browser.scripting = { executeScript };
    injectCSIfNotAlready.mockReset();
    sendMessageToAllFrames.mockReset();
  });

  afterEach(() => {
    browser.scripting = originalScripting;
  });

  it('returns empty password rules without touching the page when there is no tab', async () => {
    await expect(getDomainInfo(null)).resolves.toEqual(EMPTY_RULES);
    expect(executeScript).not.toHaveBeenCalled();
  });

  it('reads the password rules in the top frame with one injected function', async () => {
    executeScript.mockResolvedValue([{ frameId: 0, result: { minLength: '8', maxLength: '64', pattern: '[a-z]+' } }]);

    await expect(getDomainInfo(TAB)).resolves.toEqual({ minLength: '8', maxLength: '64', pattern: '[a-z]+' });
    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: TAB.id, frameIds: [0] },
      func: readPasswordRules,
      injectImmediately: true
    });
  });

  it('does not inject the content script or message the frames', async () => {
    executeScript.mockResolvedValue([{ frameId: 0, result: EMPTY_RULES }]);

    await getDomainInfo(TAB);

    expect(injectCSIfNotAlready).not.toHaveBeenCalled();
    expect(sendMessageToAllFrames).not.toHaveBeenCalled();
  });

  it('returns empty password rules when the page cannot be scripted', async () => {
    executeScript.mockRejectedValue(new Error('Cannot access contents of the page'));

    await expect(getDomainInfo(TAB)).resolves.toEqual(EMPTY_RULES);
  });

  it('returns empty password rules when the frame returned nothing', async () => {
    executeScript.mockResolvedValue([{ frameId: 0, result: null }]);

    await expect(getDomainInfo(TAB)).resolves.toEqual(EMPTY_RULES);
  });
});
