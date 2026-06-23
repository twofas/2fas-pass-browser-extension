// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import isRecentlyVerifiedInjection, { VERIFIED_INJECTION_TTL } from './isRecentlyVerifiedInjection.js';

describe('isRecentlyVerifiedInjection', () => {
  describe('fast path eligible (same autofill pass)', () => {
    it('is eligible when verified just now', () => {
      expect(isRecentlyVerifiedInjection({ verifiedAt: 10000, now: 10000 })).toBe(true);
    });

    it('is eligible while within the trust window', () => {
      const verifiedAt = 10000;
      const now = verifiedAt + VERIFIED_INJECTION_TTL - 1;

      expect(isRecentlyVerifiedInjection({ verifiedAt, now })).toBe(true);
    });

    it('respects a custom ttl', () => {
      expect(isRecentlyVerifiedInjection({ verifiedAt: 1000, now: 1500, ttl: 1000 })).toBe(true);
      expect(isRecentlyVerifiedInjection({ verifiedAt: 1000, now: 2000, ttl: 1000 })).toBe(false);
    });
  });

  describe('fast path NOT eligible (full verification required)', () => {
    it('is not eligible once the trust window has fully elapsed', () => {
      const verifiedAt = 10000;
      const now = verifiedAt + VERIFIED_INJECTION_TTL;

      expect(isRecentlyVerifiedInjection({ verifiedAt, now })).toBe(false);
    });

    it('is not eligible when there is no prior verification (undefined timestamp)', () => {
      expect(isRecentlyVerifiedInjection({ verifiedAt: undefined, now: 10000 })).toBe(false);
    });

    it('is not eligible for a non-positive timestamp', () => {
      expect(isRecentlyVerifiedInjection({ verifiedAt: 0, now: 10000 })).toBe(false);
      expect(isRecentlyVerifiedInjection({ verifiedAt: -5, now: 10000 })).toBe(false);
    });

    it('is not eligible for a future timestamp (clock skew)', () => {
      expect(isRecentlyVerifiedInjection({ verifiedAt: 10001, now: 10000 })).toBe(false);
    });
  });

  describe('safety / guards', () => {
    it('returns false for non-numeric inputs', () => {
      expect(isRecentlyVerifiedInjection({ verifiedAt: '10000', now: 10000 })).toBe(false);
      expect(isRecentlyVerifiedInjection({ verifiedAt: 10000, now: null })).toBe(false);
    });

    it('returns false when called with no arguments', () => {
      expect(isRecentlyVerifiedInjection()).toBe(false);
    });
  });
});
