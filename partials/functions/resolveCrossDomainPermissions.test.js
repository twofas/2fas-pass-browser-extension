// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discoverCrossDomainHostnames } from './resolveCrossDomainPermissions.js';

// discoverCrossDomainHostnames must stay consistent with filterInjectableFrames: a tracker
// iframe that is dropped from the messaged set (so it never answers CHECK_IFRAME_PERMISSION)
// must NOT be discovered as a cross-domain hostname either, otherwise it looks "unresponded"
// and falsely triggers the iframePermissionRetryDelay wait on every tracker-heavy page.
const setFrames = frames => {
  if (!browser.webNavigation) {
    browser.webNavigation = {};
  }

  browser.webNavigation.getAllFrames = vi.fn().mockResolvedValue(frames);
};

describe('discoverCrossDomainHostnames', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('excludes known tracker hostnames from the discovered cross-domain set', async () => {
    setFrames([
      { frameId: 0, parentFrameId: -1, url: 'https://auth.proofing.statefarm.com/login' },
      { frameId: 1, parentFrameId: 0, url: 'https://statefarm.demdex.net/dest5.html' },
      { frameId: 2, parentFrameId: 0, url: 'https://insight.adsrvr.org/track' },
      { frameId: 3, parentFrameId: 0, url: 'https://tr.snapchat.com/cm/i' },
      { frameId: 4, parentFrameId: 0, url: 'https://login.partner-bank.com/sso' }
    ]);

    const result = await discoverCrossDomainHostnames(123);

    expect([...result].sort()).toEqual(['login.partner-bank.com']);
  });

  it('still reports legitimate cross-domain hostnames and excludes the top frame', async () => {
    setFrames([
      { frameId: 0, parentFrameId: -1, url: 'https://shop.example.com/checkout' },
      { frameId: 1, parentFrameId: 0, url: 'https://pay.processor.com/widget' },
      { frameId: 2, parentFrameId: 0, url: 'https://shop.example.com/inner' }
    ]);

    const result = await discoverCrossDomainHostnames(123);

    expect([...result].sort()).toEqual(['pay.processor.com']);
  });
});
