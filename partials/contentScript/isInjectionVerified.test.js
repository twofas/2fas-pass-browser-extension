// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import isInjectionVerified from './isInjectionVerified.js';

describe('isInjectionVerified', () => {
  describe('all frames responded (fast path)', () => {
    it('is verified when every present frame answered', () => {
      expect(isInjectionVerified({ okCount: 3, frameCount: 3, topFrameReady: false, stableIterations: 0 })).toBe(true);
    });

    it('is verified when more frames answered than counted (transient frame already gone)', () => {
      expect(isInjectionVerified({ okCount: 4, frameCount: 3, topFrameReady: false, stableIterations: 0 })).toBe(true);
    });

    it('is verified for a single-frame page once the only frame answers', () => {
      expect(isInjectionVerified({ okCount: 1, frameCount: 1, topFrameReady: false, stableIterations: 0 })).toBe(true);
    });
  });

  describe('tracker-heavy page (regression: login.vanguard.com)', () => {
    // Top-frame login form + 6 uncooperative third-party tracking iframes
    // (doubleclick/adsrvr/decibel) that never answer CONTENT_SCRIPT_CHECK.
    // Only the top frame responds, so okCount (1) can never reach frameCount (7).
    // Old policy required okCount >= frameCount -> injectCSIfNotAlready returned
    // false -> autofill aborted. New policy accepts a ready, stabilised top frame.
    it('is verified once the top frame is ready and the responder count has stabilised', () => {
      expect(isInjectionVerified({ okCount: 1, frameCount: 7, topFrameReady: true, stableIterations: 4 })).toBe(true);
    });

    it('is NOT verified while the responder count is still changing (frames still loading)', () => {
      expect(isInjectionVerified({ okCount: 1, frameCount: 7, topFrameReady: true, stableIterations: 1 })).toBe(false);
    });

    it('is NOT verified when the top frame is not confirmed ready, even if stabilised', () => {
      expect(isInjectionVerified({ okCount: 1, frameCount: 7, topFrameReady: false, stableIterations: 10 })).toBe(false);
    });

    it('is NOT verified when no frame responded at all', () => {
      expect(isInjectionVerified({ okCount: 0, frameCount: 7, topFrameReady: false, stableIterations: 10 })).toBe(false);
    });

    it('respects a custom stableThreshold', () => {
      expect(isInjectionVerified({ okCount: 1, frameCount: 7, topFrameReady: true, stableIterations: 2, stableThreshold: 6 })).toBe(false);
      expect(isInjectionVerified({ okCount: 1, frameCount: 7, topFrameReady: true, stableIterations: 6, stableThreshold: 6 })).toBe(true);
    });
  });

  describe('safety / guards', () => {
    it('is NOT verified when there are no injectable frames', () => {
      expect(isInjectionVerified({ okCount: 0, frameCount: 0, topFrameReady: false, stableIterations: 0 })).toBe(false);
    });

    it('does not treat a ready top frame as all-frames when frameCount is 0', () => {
      expect(isInjectionVerified({ okCount: 0, frameCount: 0, topFrameReady: true, stableIterations: 10 })).toBe(false);
    });

    it('returns false for non-numeric inputs', () => {
      expect(isInjectionVerified({ okCount: undefined, frameCount: 3, topFrameReady: true, stableIterations: 9 })).toBe(false);
      expect(isInjectionVerified({ okCount: 2, frameCount: null, topFrameReady: true, stableIterations: 9 })).toBe(false);
    });

    it('returns false when called with no arguments', () => {
      expect(isInjectionVerified()).toBe(false);
    });
  });
});
