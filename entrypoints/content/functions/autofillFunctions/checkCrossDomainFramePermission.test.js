// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { isTopFrameMock, getFrameHostnameMock } = vi.hoisted(() => ({
  isTopFrameMock: vi.fn(),
  getFrameHostnameMock: vi.fn()
}));

vi.mock('@/partials/functions/isTopFrame', () => ({ default: isTopFrameMock }));
vi.mock('@/partials/functions/getFrameHostname', () => ({ default: getFrameHostnameMock }));

import checkCrossDomainFramePermission from './checkCrossDomainFramePermission';

const stubTopHref = href => {
  vi.stubGlobal('window', { top: { location: { href } } });
};

const stubTopLocationThrows = () => {
  vi.stubGlobal('window', {
    top: {
      get location() {
        throw new Error('cross-origin access blocked');
      }
    }
  });
};

describe('checkCrossDomainFramePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('allows the top frame without reading the hostname', () => {
    isTopFrameMock.mockReturnValue(true);

    const result = checkCrossDomainFramePermission({});

    expect(result).toEqual({ allowed: true, frameHostname: '' });
    expect(getFrameHostnameMock).not.toHaveBeenCalled();
  });

  it('allows a same-domain sub-frame', () => {
    isTopFrameMock.mockReturnValue(false);
    getFrameHostnameMock.mockReturnValue('example.com');
    stubTopHref('https://example.com/login');

    const result = checkCrossDomainFramePermission({});

    expect(result).toEqual({ allowed: true, frameHostname: 'example.com' });
  });

  it('allows a cross-domain sub-frame listed in crossDomainAllowedDomains', () => {
    isTopFrameMock.mockReturnValue(false);
    getFrameHostnameMock.mockReturnValue('pay.stripe.com');
    stubTopHref('https://shop.example.com/checkout');

    const result = checkCrossDomainFramePermission({ crossDomainAllowedDomains: ['pay.stripe.com'] });

    expect(result).toEqual({ allowed: true, frameHostname: 'pay.stripe.com' });
  });

  it('denies a cross-domain sub-frame absent from crossDomainAllowedDomains', () => {
    isTopFrameMock.mockReturnValue(false);
    getFrameHostnameMock.mockReturnValue('evil.example.net');
    stubTopHref('https://shop.example.com/checkout');

    const result = checkCrossDomainFramePermission({ crossDomainAllowedDomains: ['pay.stripe.com'] });

    expect(result.allowed).toBe(false);
  });

  it('denies a cross-domain sub-frame when crossDomainAllowedDomains is an empty list (fail-closed)', () => {
    isTopFrameMock.mockReturnValue(false);
    getFrameHostnameMock.mockReturnValue('pay.stripe.com');
    stubTopHref('https://shop.example.com/checkout');

    const result = checkCrossDomainFramePermission({ crossDomainAllowedDomains: [] });

    expect(result.allowed).toBe(false);
  });

  it('falls back to iframePermissionGranted when no allow-list is provided', () => {
    isTopFrameMock.mockReturnValue(false);
    getFrameHostnameMock.mockReturnValue('pay.stripe.com');
    stubTopHref('https://shop.example.com/checkout');

    expect(checkCrossDomainFramePermission({ iframePermissionGranted: true }).allowed).toBe(true);
    expect(checkCrossDomainFramePermission({ iframePermissionGranted: false }).allowed).toBe(false);
    expect(checkCrossDomainFramePermission({}).allowed).toBe(false);
  });

  it('treats an unreadable cross-origin top location as cross-domain', () => {
    isTopFrameMock.mockReturnValue(false);
    getFrameHostnameMock.mockReturnValue('pay.stripe.com');
    stubTopLocationThrows();

    expect(checkCrossDomainFramePermission({}).allowed).toBe(false);
    expect(checkCrossDomainFramePermission({ iframePermissionGranted: true }).allowed).toBe(true);
    expect(checkCrossDomainFramePermission({ crossDomainAllowedDomains: ['pay.stripe.com'] }).allowed).toBe(true);
  });
});
