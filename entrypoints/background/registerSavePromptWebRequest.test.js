// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Submit detection for the save prompt: webRequest.onBeforeRequest with requestBody.
// Firefox and Safari label navigator.sendBeacon() requests as 'beacon' (Gecko
// ChannelWrapper TYPE_BEACON, WebKit ResourceLoadInfo::Type::Beacon), Chromium labels
// them 'ping' and rejects 'beacon' in a filter. The beacon listener is limited to the
// prompt.js beacon URL so other sites' analytics beacons never wake it. Safari
// registers only from 18.4, which added requestBody / extraInfoSpec to onBeforeRequest.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./events', () => ({ onWebRequest: vi.fn() }));

import registerSavePromptWebRequest from './registerSavePromptWebRequest.js';
import { onWebRequest } from './events';

const safariUA = version => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Safari/605.1.15`;
const MAIN_FILTER = { urls: ['<all_urls>'], types: ['main_frame', 'sub_frame', 'xmlhttprequest', 'ping'] };
const BEACON_FILTER = { urls: [`https://${import.meta.env.VITE_BEACON}.invalid/*`], types: ['beacon'] };

describe('registerSavePromptWebRequest', () => {
  let addListener;
  let originalWebRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    addListener = vi.fn();
    originalWebRequest = browser.webRequest;
    browser.webRequest = { onBeforeRequest: { addListener } };
  });

  afterEach(() => {
    browser.webRequest = originalWebRequest;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each(['chrome', 'edge', 'opera'])('keeps the single Chromium listener on %s (ping, no beacon)', browserName => {
    vi.stubEnv('BROWSER', browserName);

    expect(registerSavePromptWebRequest({}, [], {})).toBe(true);
    expect(addListener).toHaveBeenCalledTimes(1);
    expect(addListener).toHaveBeenCalledWith(expect.any(Function), MAIN_FILTER, ['requestBody']);
  });

  it('adds a beacon listener limited to the prompt.js beacon URL on Firefox', () => {
    vi.stubEnv('BROWSER', 'firefox');

    expect(registerSavePromptWebRequest({}, [], {})).toBe(true);
    expect(addListener).toHaveBeenCalledTimes(2);
    expect(addListener).toHaveBeenNthCalledWith(1, expect.any(Function), MAIN_FILTER, ['requestBody']);
    expect(addListener).toHaveBeenNthCalledWith(2, expect.any(Function), BEACON_FILTER, ['requestBody']);
    expect(addListener.mock.calls[0][0]).not.toBe(addListener.mock.calls[1][0]);
  });

  it('registers both listeners on Safari 18.4+', () => {
    vi.stubEnv('BROWSER', 'safari');
    vi.stubGlobal('navigator', { userAgent: safariUA('18.4') });

    expect(registerSavePromptWebRequest({}, [], {})).toBe(true);
    expect(addListener).toHaveBeenNthCalledWith(1, expect.any(Function), MAIN_FILTER, ['requestBody']);
    expect(addListener).toHaveBeenNthCalledWith(2, expect.any(Function), BEACON_FILTER, ['requestBody']);
  });

  it('does not register on Safari older than 18.4', () => {
    vi.stubEnv('BROWSER', 'safari');
    vi.stubGlobal('navigator', { userAgent: safariUA('18.3') });

    expect(registerSavePromptWebRequest({}, [], {})).toBe(false);
    expect(addListener).not.toHaveBeenCalled();
  });

  it('does not register when the webRequest API is unavailable', () => {
    vi.stubEnv('BROWSER', 'chrome');
    browser.webRequest = undefined;

    expect(registerSavePromptWebRequest({}, [], {})).toBe(false);
  });

  it('does not throw when the browser rejects the main listener', () => {
    vi.stubEnv('BROWSER', 'firefox');
    addListener.mockImplementation(() => {
      throw new Error('Invalid filter');
    });

    expect(registerSavePromptWebRequest({}, [], {})).toBe(false);
    expect(addListener).toHaveBeenCalledTimes(1);
  });

  it('keeps the main listener when only the beacon listener is rejected', () => {
    vi.stubEnv('BROWSER', 'firefox');
    addListener.mockImplementationOnce(() => {}).mockImplementationOnce(() => {
      throw new Error("'beacon' is an unknown resource type");
    });

    expect(registerSavePromptWebRequest({}, [], {})).toBe(true);
  });

  it('forwards both listeners to onWebRequest with the shared background state', () => {
    vi.stubEnv('BROWSER', 'firefox');
    const tabsInputData = {};
    const savePromptActions = [];
    const tabUpdateData = {};
    const details = { tabId: 1, method: 'POST' };

    registerSavePromptWebRequest(tabsInputData, savePromptActions, tabUpdateData);
    addListener.mock.calls[0][0](details);
    addListener.mock.calls[1][0](details);

    expect(onWebRequest).toHaveBeenCalledTimes(2);
    expect(onWebRequest).toHaveBeenCalledWith(details, tabsInputData, savePromptActions, tabUpdateData);
  });
});
