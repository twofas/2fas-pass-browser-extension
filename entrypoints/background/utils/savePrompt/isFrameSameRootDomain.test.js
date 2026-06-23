// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import isFrameSameRootDomain, { hostnameFromUrl } from './isFrameSameRootDomain.js';

describe('hostnameFromUrl', () => {
  it('returns the hostname of a valid http(s) URL', () => {
    expect(hostnameFromUrl('https://www.example.com/login?x=1')).toBe('www.example.com');
    expect(hostnameFromUrl('http://example.com')).toBe('example.com');
  });

  it('ignores port and path', () => {
    expect(hostnameFromUrl('https://example.com:8443/a/b')).toBe('example.com');
  });

  it('returns "" for about:blank / about:srcdoc / empty / non-string', () => {
    expect(hostnameFromUrl('about:blank')).toBe('');
    expect(hostnameFromUrl('about:srcdoc')).toBe('');
    expect(hostnameFromUrl('')).toBe('');
    expect(hostnameFromUrl(undefined)).toBe('');
    expect(hostnameFromUrl(null)).toBe('');
    expect(hostnameFromUrl('not a url')).toBe('');
  });
});

describe('isFrameSameRootDomain', () => {
  it('returns true for identical origins', () => {
    expect(isFrameSameRootDomain('https://example.com/login', 'https://example.com/')).toBe(true);
  });

  it('returns true across subdomains of the same root domain (the finding scope)', () => {
    expect(isFrameSameRootDomain('https://login.example.com/', 'https://www.example.com/')).toBe(true);
    expect(isFrameSameRootDomain('https://auth.shop.example.com/', 'https://example.com/')).toBe(true);
  });

  it('ignores scheme and port differences (root domain only)', () => {
    expect(isFrameSameRootDomain('http://example.com/', 'https://example.com/')).toBe(true);
    expect(isFrameSameRootDomain('https://example.com:8443/', 'https://example.com/')).toBe(true);
  });

  it('returns false for different root domains (e.g. cross-domain SSO widget)', () => {
    expect(isFrameSameRootDomain('https://accounts.google.com/', 'https://example.com/')).toBe(false);
    expect(isFrameSameRootDomain('https://evil.com/', 'https://example.com/')).toBe(false);
  });

  it('does not match on a shared suffix that is not the root domain', () => {
    expect(isFrameSameRootDomain('https://example.com.evil.com/', 'https://example.com/')).toBe(false);
  });

  it('returns false when either URL has no resolvable hostname (about:blank / invalid)', () => {
    expect(isFrameSameRootDomain('about:blank', 'https://example.com/')).toBe(false);
    expect(isFrameSameRootDomain('https://example.com/', 'about:srcdoc')).toBe(false);
    expect(isFrameSameRootDomain('', 'https://example.com/')).toBe(false);
    expect(isFrameSameRootDomain(undefined, undefined)).toBe(false);
  });
});
