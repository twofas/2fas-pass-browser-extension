// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import hasCredentialPairForOrigin from './hasCredentialPairForOrigin';

const ORIGIN = 'https://example.com';

describe('hasCredentialPairForOrigin', () => {
  it('is true when the page has a username and a password value', () => {
    expect(hasCredentialPairForOrigin({
      u: { type: 'username', value: 'jan', url: ORIGIN },
      p: { type: 'password', value: 'S3cret', url: ORIGIN }
    }, ORIGIN)).toBe(true);
  });

  it('is false while the password is still on its way', () => {
    expect(hasCredentialPairForOrigin({ u: { type: 'username', value: 'jan', url: ORIGIN } }, ORIGIN)).toBe(false);
  });

  it('ignores values captured on another origin and empty values', () => {
    expect(hasCredentialPairForOrigin({
      u: { type: 'username', value: 'jan', url: ORIGIN },
      p: { type: 'password', value: 'S3cret', url: 'https://other.com' },
      e: { type: 'password', value: '', url: ORIGIN }
    }, ORIGIN)).toBe(false);
  });

  it('is false without inputs or origin', () => {
    expect(hasCredentialPairForOrigin(undefined, ORIGIN)).toBe(false);
    expect(hasCredentialPairForOrigin({ u: { type: 'username', value: 'jan', url: ORIGIN } }, '')).toBe(false);
  });
});
