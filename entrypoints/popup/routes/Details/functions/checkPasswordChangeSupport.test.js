// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import findPasswordChangeUrl from './checkPasswordChangeSupport.js';

const CHANGE_PASSWORD_PATH = '/.well-known/change-password';
const RELIABILITY_PATH = '/.well-known/resource-that-should-not-exist-whose-status-code-should-not-be-200';

/**
 * Stubs global fetch with a per-host status map so the well-known and reliability
 * probes can be answered independently per origin.
 * @param {Object} config - Map of hostname to { changePassword, reliability } status codes
 * @return {Function} The fetch mock
 */
const stubFetchByHost = config => {
  const fetchMock = vi.fn(async url => {
    const { hostname } = new URL(url);
    const hostConfig = config[hostname] ?? {};
    let status = 404;

    if (url.endsWith(CHANGE_PASSWORD_PATH)) {
      status = hostConfig.changePassword ?? 404;
    } else if (url.endsWith(RELIABILITY_PATH)) {
      status = hostConfig.reliability ?? 404;
    }

    return { status, ok: status >= 200 && status < 300 };
  });

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

describe('findPasswordChangeUrl', () => {
  beforeEach(() => {
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns null on a soft-404 origin that answers 200 to a path that should not exist', async () => {
    stubFetchByHost({ 'app.filen.io': { changePassword: 200, reliability: 200 } });

    const result = await findPasswordChangeUrl([{ text: 'https://app.filen.io' }]);

    expect(result).toBeNull();
  });

  it('returns the well-known URL when the origin reports reliable status codes', async () => {
    stubFetchByHost({ 'accounts.example.com': { changePassword: 200, reliability: 404 } });

    const result = await findPasswordChangeUrl([{ text: 'https://accounts.example.com' }]);

    expect(result).toBe('https://accounts.example.com/.well-known/change-password');
  });

  it('probes the canonical W3C reliability path before trusting the change-password URL', async () => {
    const fetchMock = stubFetchByHost({ 'accounts.example.com': { changePassword: 200, reliability: 404 } });

    await findPasswordChangeUrl([{ text: 'https://accounts.example.com' }]);

    const probedUrls = fetchMock.mock.calls.map(call => call[0]);
    expect(probedUrls).toContain(`https://accounts.example.com${RELIABILITY_PATH}`);
  });

  it('returns null when the origin does not expose a change-password URL', async () => {
    stubFetchByHost({ 'accounts.example.com': { changePassword: 404, reliability: 404 } });

    const result = await findPasswordChangeUrl([{ text: 'https://accounts.example.com' }]);

    expect(result).toBeNull();
  });

  it('returns null when the reliability probe cannot be completed', async () => {
    const fetchMock = vi.fn(async url => {
      if (url.endsWith(CHANGE_PASSWORD_PATH)) {
        return { status: 200, ok: true };
      }

      throw new TypeError('network error');
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await findPasswordChangeUrl([{ text: 'https://accounts.example.com' }]);

    expect(result).toBeNull();
  });

  it('falls back to a parent domain that reports reliable status codes', async () => {
    stubFetchByHost({
      'app.example.com': { changePassword: 404, reliability: 404 },
      'example.com': { changePassword: 200, reliability: 404 }
    });

    const result = await findPasswordChangeUrl([{ text: 'https://app.example.com' }]);

    expect(result).toBe('https://example.com/.well-known/change-password');
  });

  it('does not return a parent-domain URL when that parent is a soft-404 origin', async () => {
    stubFetchByHost({
      'app.example.com': { changePassword: 404, reliability: 404 },
      'example.com': { changePassword: 200, reliability: 200 }
    });

    const result = await findPasswordChangeUrl([{ text: 'https://app.example.com' }]);

    expect(result).toBeNull();
  });

  it('returns null for an empty list of URIs', async () => {
    const result = await findPasswordChangeUrl([]);

    expect(result).toBeNull();
  });
});
