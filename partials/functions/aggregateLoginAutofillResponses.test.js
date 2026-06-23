// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { AUTOFILL_RESULT_CODES } from '@/constants';
import aggregateLoginAutofillResponses from './aggregateLoginAutofillResponses.js';

const okFrame = (canAutofillUsername, canAutofillPassword) => ({ status: 'ok', canAutofillUsername, canAutofillPassword });
const noInputsFrame = () => ({ status: 'error', code: AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS, message: 'No input fields found', canAutofillPassword: false, canAutofillUsername: false });
const cancelledFrame = () => ({ status: 'cancelled', code: AUTOFILL_RESULT_CODES.CROSS_DOMAIN_DENIED, message: 'Cross-domain autofill not permitted', canAutofillPassword: true, canAutofillUsername: true });

describe('aggregateLoginAutofillResponses', () => {
  describe('non-array / empty input', () => {
    it('returns not-ok for false (failed broadcast)', () => {
      const result = aggregateLoginAutofillResponses(false, { username: 'u', password: 'p' });
      expect(result.isOk).toBe(false);
      expect(result.allFieldsFilled).toBe(false);
    });

    it('returns not-ok for null', () => {
      const result = aggregateLoginAutofillResponses(null, { username: 'u', password: 'p' });
      expect(result.isOk).toBe(false);
    });

    it('returns not-ok for undefined', () => {
      const result = aggregateLoginAutofillResponses(undefined, { username: 'u', password: 'p' });
      expect(result.isOk).toBe(false);
    });

    it('returns not-ok for an empty array', () => {
      const result = aggregateLoginAutofillResponses([], { username: 'u', password: 'p' });
      expect(result.isOk).toBe(false);
    });
  });

  describe('single-frame happy paths', () => {
    it('is ok + allFieldsFilled when one frame fills both username and password', () => {
      const result = aggregateLoginAutofillResponses([okFrame(true, true)], { username: 'u', password: 'p' });
      expect(result.isOk).toBe(true);
      expect(result.allFieldsFilled).toBe(true);
    });

    it('is allFieldsFilled when only a username was requested and it was filled', () => {
      const result = aggregateLoginAutofillResponses([okFrame(true, false)], { username: 'u' });
      expect(result.isOk).toBe(true);
      expect(result.allFieldsFilled).toBe(true);
    });

    it('is allFieldsFilled when only a password was requested and it was filled', () => {
      const result = aggregateLoginAutofillResponses([okFrame(false, true)], { password: 'p' });
      expect(result.isOk).toBe(true);
      expect(result.allFieldsFilled).toBe(true);
    });
  });

  describe('genuine partial fills (must still report allFieldsFilled=false)', () => {
    it('is not allFieldsFilled when password was requested but no frame had a password field', () => {
      const result = aggregateLoginAutofillResponses([okFrame(true, false)], { username: 'u', password: 'p' });
      expect(result.isOk).toBe(true);
      expect(result.allFieldsFilled).toBe(false);
    });

    it('is not allFieldsFilled when username was requested but no frame had a username field', () => {
      const result = aggregateLoginAutofillResponses([okFrame(false, true)], { username: 'u', password: 'p' });
      expect(result.isOk).toBe(true);
      expect(result.allFieldsFilled).toBe(false);
    });
  });

  describe('regression: finding #43 — split username/password across frames', () => {
    // Username lives in the top frame, password in an iframe. Each frame returns
    // 'ok' with only one capability flag true. The old per-frame `every` check
    // zeroed allFieldsFilled even though both fields were filled overall.
    it('is allFieldsFilled when username is in one frame and password in another', () => {
      const result = aggregateLoginAutofillResponses(
        [okFrame(true, false), okFrame(false, true)],
        { username: 'u', password: 'p' }
      );
      expect(result.isOk).toBe(true);
      expect(result.allFieldsFilled).toBe(true);
    });

    it('is allFieldsFilled with the split order reversed', () => {
      const result = aggregateLoginAutofillResponses(
        [okFrame(false, true), okFrame(true, false)],
        { username: 'u', password: 'p' }
      );
      expect(result.allFieldsFilled).toBe(true);
    });
  });

  describe('regression: finding #43 — neutral frames must not zero a complete fill', () => {
    it('treats literal false entries (rejected sendMessage) as neutral', () => {
      // sendMessageToAllFrames inserts `false` for frames whose sendMessage rejected
      // (e.g. sandboxed ad iframes). These must not turn a complete fill into partial.
      const result = aggregateLoginAutofillResponses(
        [okFrame(true, true), false],
        { username: 'u', password: 'p' }
      );
      expect(result.isOk).toBe(true);
      expect(result.allFieldsFilled).toBe(true);
    });

    it('treats null / undefined / status-less entries as neutral', () => {
      const result = aggregateLoginAutofillResponses(
        [null, undefined, { message: 'no status' }, okFrame(true, true)],
        { username: 'u', password: 'p' }
      );
      expect(result.isOk).toBe(true);
      expect(result.allFieldsFilled).toBe(true);
    });

    it('treats a cross-domain-denied (cancelled) frame as neutral when the main frame filled both', () => {
      const result = aggregateLoginAutofillResponses(
        [okFrame(true, true), cancelledFrame()],
        { username: 'u', password: 'p' }
      );
      expect(result.isOk).toBe(true);
      expect(result.allFieldsFilled).toBe(true);
    });

    it('treats NO_INPUT_FIELDS noise frames as neutral when a sibling frame filled everything', () => {
      const result = aggregateLoginAutofillResponses(
        [noInputsFrame(), okFrame(true, true)],
        { username: 'u', password: 'p' }
      );
      expect(result.isOk).toBe(true);
      expect(result.allFieldsFilled).toBe(true);
    });
  });

  describe('failure paths', () => {
    it('is not ok when every frame had no inputs', () => {
      const result = aggregateLoginAutofillResponses([noInputsFrame(), noInputsFrame()], { username: 'u', password: 'p' });
      expect(result.isOk).toBe(false);
    });

    it('is not ok when the only relevant frame was cross-domain denied', () => {
      const result = aggregateLoginAutofillResponses([cancelledFrame()], { username: 'u', password: 'p' });
      expect(result.isOk).toBe(false);
    });

    it('is not ok when the broadcast resolved to all-false', () => {
      const result = aggregateLoginAutofillResponses([false, false], { username: 'u', password: 'p' });
      expect(result.isOk).toBe(false);
    });
  });
});
