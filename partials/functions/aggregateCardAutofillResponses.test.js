// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { AUTOFILL_RESULT_CODES } from '@/constants';
import aggregateCardAutofillResponses from './aggregateCardAutofillResponses.js';

describe('aggregateCardAutofillResponses', () => {
  describe('non-array / empty input', () => {
    it('returns noInputs for false (failed broadcast)', () => {
      const result = aggregateCardAutofillResponses(false);
      expect(result.outcome).toBe('noInputs');
      expect(result.isOk).toBe(false);
      expect(result.isPartial).toBe(false);
      expect(result.hasMissingInputs).toBe(false);
      expect(result.missingInputFields).toEqual([]);
      expect(result.filledFields).toEqual({});
    });

    it('returns noInputs for null', () => {
      expect(aggregateCardAutofillResponses(null).outcome).toBe('noInputs');
    });

    it('returns noInputs for undefined', () => {
      expect(aggregateCardAutofillResponses(undefined).outcome).toBe('noInputs');
    });

    it('returns noInputs for an empty array', () => {
      expect(aggregateCardAutofillResponses([]).outcome).toBe('noInputs');
    });
  });

  describe('irrelevant frames are filtered out', () => {
    it('treats every frame replying with the NO_INPUT_FIELDS code as noInputs', () => {
      const result = aggregateCardAutofillResponses([
        { status: 'error', code: AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS, message: 'No input fields found', filledFields: {} },
        { status: 'error', code: AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS, message: 'No input fields found', filledFields: {} }
      ]);
      expect(result.outcome).toBe('noInputs');
    });

    it('keys noise detection off the code, not the human-readable message (regression: finding #25)', () => {
      // A frame carrying the NO_INPUT_FIELDS code is filtered as noise even if its
      // message wording drifts; a frame whose message merely reads like the legacy
      // string but lacks the code is treated as a real error, not noise.
      const result = aggregateCardAutofillResponses([
        { status: 'error', code: AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS, message: 'reworded: nothing to fill here', filledFields: {} },
        { status: 'error', message: 'No input fields found', filledFields: {} }
      ]);
      expect(result.outcome).toBe('error');
      expect(result.isOk).toBe(false);
    });

    it('ignores null/undefined and status-less entries in the array', () => {
      const result = aggregateCardAutofillResponses([
        null,
        undefined,
        { message: 'no status here' },
        { status: 'ok', filledFields: { cardNumber: true }, missingInputFields: [] }
      ]);
      expect(result.outcome).toBe('ok');
      expect(result.isOk).toBe(true);
    });
  });

  describe('ok outcome', () => {
    it('is ok when a single frame fills everything with no missing inputs', () => {
      const result = aggregateCardAutofillResponses([
        { status: 'ok', filledFields: { cardNumber: true, expirationDate: true, securityCode: true }, missingInputFields: [] }
      ]);
      expect(result.outcome).toBe('ok');
      expect(result.isOk).toBe(true);
      expect(result.isPartial).toBe(false);
      expect(result.hasMissingInputs).toBe(false);
      expect(result.missingInputFields).toEqual([]);
    });

    it('merges filledFields across frames', () => {
      const result = aggregateCardAutofillResponses([
        { status: 'ok', filledFields: { cardNumber: true }, missingInputFields: [] },
        { status: 'ok', filledFields: { securityCode: true }, missingInputFields: [] }
      ]);
      expect(result.outcome).toBe('ok');
      expect(result.filledFields).toEqual({ cardNumber: true, securityCode: true });
    });
  });

  describe('error outcome (regression: silent failure when all frames are cancelled/error)', () => {
    // sendCardAutofillToTab previously had no `!isOk && !isPartial` branch, so a
    // page where every relevant frame returned 'cancelled' (cross-domain denied)
    // or 'error' ended with no user-facing notification. The shared aggregation
    // must classify this as 'error' so all four callers can surface it.
    it('is error when the only relevant frame was cancelled (cross-domain denied)', () => {
      const result = aggregateCardAutofillResponses([
        { status: 'cancelled', code: AUTOFILL_RESULT_CODES.CROSS_DOMAIN_DENIED, message: 'Cross-domain autofill not permitted', filledFields: {} }
      ]);
      expect(result.outcome).toBe('error');
      expect(result.isOk).toBe(false);
      expect(result.isPartial).toBe(false);
    });

    it('is error when frames returned error "No fields were filled"', () => {
      const result = aggregateCardAutofillResponses([
        { status: 'error', message: 'No fields were filled', filledFields: {}, missingInputFields: [] }
      ]);
      expect(result.outcome).toBe('error');
    });

    it('is error when mixing cancelled and non-NO_INPUT_FIELDS errors', () => {
      const result = aggregateCardAutofillResponses([
        { status: 'cancelled', code: AUTOFILL_RESULT_CODES.CROSS_DOMAIN_DENIED, message: 'Cross-domain autofill not permitted', filledFields: {} },
        { status: 'error', message: 'Decrypt error' }
      ]);
      expect(result.outcome).toBe('error');
    });
  });

  describe('partial outcome', () => {
    it('is partial when a frame reports status partial', () => {
      const result = aggregateCardAutofillResponses([
        {
          status: 'partial',
          message: 'Some critical fields could not be filled',
          failedFields: ['expirationDate'],
          missingInputFields: [],
          filledFields: { cardNumber: true, expirationDate: false }
        }
      ]);
      expect(result.outcome).toBe('partial');
      expect(result.isPartial).toBe(true);
    });

    it('is partial when ok but an input for a held field was missing', () => {
      const result = aggregateCardAutofillResponses([
        { status: 'ok', filledFields: { cardNumber: true }, missingInputFields: ['securityCode'] }
      ]);
      expect(result.outcome).toBe('partial');
      expect(result.isOk).toBe(true);
      expect(result.isPartial).toBe(false);
      expect(result.hasMissingInputs).toBe(true);
      expect(result.missingInputFields).toEqual(['securityCode']);
    });

    it('deduplicates missing fields reported by multiple frames', () => {
      const result = aggregateCardAutofillResponses([
        { status: 'ok', filledFields: { cardNumber: true }, missingInputFields: ['securityCode', 'expirationDate'] },
        { status: 'ok', filledFields: {}, missingInputFields: ['securityCode'] }
      ]);
      expect(result.outcome).toBe('partial');
      expect(result.missingInputFields).toEqual(['securityCode', 'expirationDate']);
    });

    it('drops a field from missingInputFields once another frame filled it', () => {
      // One frame had no securityCode input (reports it missing); a sibling frame
      // actually filled it. The aggregate must not flag securityCode as missing.
      const result = aggregateCardAutofillResponses([
        { status: 'ok', filledFields: { cardNumber: true }, missingInputFields: ['securityCode'] },
        { status: 'ok', filledFields: { securityCode: true }, missingInputFields: [] }
      ]);
      expect(result.outcome).toBe('ok');
      expect(result.hasMissingInputs).toBe(false);
      expect(result.missingInputFields).toEqual([]);
      expect(result.filledFields).toEqual({ cardNumber: true, securityCode: true });
    });
  });

  describe('mixed multi-frame scenarios', () => {
    it('prefers partial over ok when any frame is partial', () => {
      const result = aggregateCardAutofillResponses([
        { status: 'ok', filledFields: { cardNumber: true }, missingInputFields: [] },
        { status: 'partial', failedFields: ['securityCode'], missingInputFields: [], filledFields: { securityCode: false } }
      ]);
      expect(result.outcome).toBe('partial');
    });

    it('classifies as ok when a real fill coexists with NO_INPUT_FIELDS noise frames', () => {
      const result = aggregateCardAutofillResponses([
        { status: 'error', code: AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS, message: 'No input fields found', filledFields: {} },
        { status: 'ok', filledFields: { cardNumber: true, expirationDate: true }, missingInputFields: [] }
      ]);
      expect(result.outcome).toBe('ok');
    });
  });
});
