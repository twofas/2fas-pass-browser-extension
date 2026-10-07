// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, afterEach, vi } from 'vitest';
import isSavePromptSupported, { getSafariVersion } from './isSavePromptSupported.js';

const safariUA = version => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Safari/605.1.15`;
const chromeUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

describe('getSafariVersion', () => {
  it('reads major and minor from the Safari user agent', () => {
    expect(getSafariVersion(safariUA('18.4'))).toEqual({ major: 18, minor: 4 });
    expect(getSafariVersion(safariUA('17.6'))).toEqual({ major: 17, minor: 6 });
    expect(getSafariVersion(safariUA('26.0.1'))).toEqual({ major: 26, minor: 0 });
  });

  it('treats a missing minor as 0', () => {
    expect(getSafariVersion(safariUA('26'))).toEqual({ major: 26, minor: 0 });
  });

  it('returns null when there is no Safari version', () => {
    expect(getSafariVersion(chromeUA)).toBeNull();
    expect(getSafariVersion('')).toBeNull();
    expect(getSafariVersion(undefined)).toBeNull();
  });
});

describe('isSavePromptSupported', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each(['chrome', 'edge', 'opera', 'firefox'])('is supported on %s regardless of the user agent', browserName => {
    vi.stubEnv('BROWSER', browserName);

    expect(isSavePromptSupported('')).toBe(true);
  });

  it.each(['18.4', '18.4.1', '18.5', '18.6', '26.0', '26.1', '27.0'])('is supported on Safari %s', version => {
    vi.stubEnv('BROWSER', 'safari');

    expect(isSavePromptSupported(safariUA(version))).toBe(true);
  });

  it.each(['14.1', '16.6', '17.6', '18.0', '18.3', '18.3.1'])('is not supported on Safari %s (no webRequest requestBody in MV3)', version => {
    vi.stubEnv('BROWSER', 'safari');

    expect(isSavePromptSupported(safariUA(version))).toBe(false);
  });

  it('is not supported on Safari when the version cannot be read', () => {
    vi.stubEnv('BROWSER', 'safari');

    expect(isSavePromptSupported('Mozilla/5.0 AppleWebKit/605.1.15')).toBe(false);
  });

  it('reads navigator.userAgent by default', () => {
    vi.stubEnv('BROWSER', 'safari');
    vi.stubGlobal('navigator', { userAgent: safariUA('18.4') });

    expect(isSavePromptSupported()).toBe(true);
  });
});
