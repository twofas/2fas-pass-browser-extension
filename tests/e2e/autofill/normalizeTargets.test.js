// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { normalizeTarget, normalizeTargets } from './normalizeTargets.js';

describe('normalizeTargets', () => {
  it('normalizes a string into a full entry with defaults', () => {
    expect(normalizeTarget('https://login.vanguard.com/')).toEqual({
      url: 'https://login.vanguard.com/',
      name: 'https://login.vanguard.com/',
      expect: { username: true, password: true },
      crossDomain: false,
      clickBefore: []
    });
  });

  it('keeps provided expect/crossDomain/name and fills the rest', () => {
    expect(normalizeTarget({ url: 'https://x.example/login', name: 'X', expect: { password: false }, crossDomain: true })).toEqual({
      url: 'https://x.example/login',
      name: 'X',
      expect: { username: true, password: false },
      crossDomain: true,
      clickBefore: []
    });
  });

  it('normalizes clickBefore from a string and an array', () => {
    expect(normalizeTarget({ url: 'https://x.example', clickBefore: '.sign-in' }).clickBefore).toEqual(['.sign-in']);
    expect(normalizeTarget({ url: 'https://x.example', clickBefore: ['.a', '', '.b', 7] }).clickBefore).toEqual(['.a', '.b']);
    expect(normalizeTarget({ url: 'https://x.example' }).clickBefore).toEqual([]);
  });

  it('maps an array', () => {
    const out = normalizeTargets(['https://a.example', { url: 'https://b.example' }]);
    expect(out).toHaveLength(2);
    expect(out[0].url).toBe('https://a.example');
    expect(out[1].url).toBe('https://b.example');
  });

  it('throws on an entry without a url', () => {
    expect(() => normalizeTarget({ name: 'no url' })).toThrow(/url/i);
    expect(() => normalizeTarget(123)).toThrow(/url/i);
  });
});
