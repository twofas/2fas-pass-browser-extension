// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { getSecurityCodeMask, SECURITY_CODE_MASKS } from './getSecurityCodeMask';

describe('getSecurityCodeMask', () => {
  describe('empty/null input', () => {
    it('returns STANDARD mask for null input', () => {
      expect(getSecurityCodeMask(null)).toEqual({ ...SECURITY_CODE_MASKS.STANDARD });
    });

    it('returns STANDARD mask for undefined input', () => {
      expect(getSecurityCodeMask(undefined)).toEqual({ ...SECURITY_CODE_MASKS.STANDARD });
    });

    it('returns STANDARD mask for empty string', () => {
      expect(getSecurityCodeMask('')).toEqual({ ...SECURITY_CODE_MASKS.STANDARD });
    });

    it('returns STANDARD mask for string with only spaces', () => {
      expect(getSecurityCodeMask('    ')).toEqual({ ...SECURITY_CODE_MASKS.STANDARD });
    });
  });

  describe('American Express cards (4-digit CVV)', () => {
    it('returns AMEX mask for Stripe test card 378282246310005', () => {
      const result = getSecurityCodeMask('378282246310005');
      expect(result.mask).toBe(SECURITY_CODE_MASKS.AMEX.mask);
      expect(result.placeholder).toBe('1234');
    });

    it('returns AMEX mask for Stripe test card 371449635398431', () => {
      const result = getSecurityCodeMask('371449635398431');
      expect(result.mask).toBe(SECURITY_CODE_MASKS.AMEX.mask);
    });

    it('returns AMEX mask for partial input starting with 34', () => {
      expect(getSecurityCodeMask('34').mask).toBe(SECURITY_CODE_MASKS.AMEX.mask);
    });

    it('returns AMEX mask for partial input starting with 37', () => {
      expect(getSecurityCodeMask('37').mask).toBe(SECURITY_CODE_MASKS.AMEX.mask);
    });

    it('returns AMEX mask for formatted card number with spaces', () => {
      expect(getSecurityCodeMask('3782 822463 10005').mask).toBe(SECURITY_CODE_MASKS.AMEX.mask);
    });
  });

  describe('Non-Amex cards (3-digit CVV)', () => {
    it('returns STANDARD mask for Visa card 4242424242424242', () => {
      const result = getSecurityCodeMask('4242424242424242');
      expect(result.mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
      expect(result.placeholder).toBe('123');
    });

    it('returns STANDARD mask for Mastercard 5555555555554444', () => {
      expect(getSecurityCodeMask('5555555555554444').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });

    it('returns STANDARD mask for Discover 6011111111111117', () => {
      expect(getSecurityCodeMask('6011111111111117').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });

    it('returns STANDARD mask for Diners Club 3056930009020004', () => {
      expect(getSecurityCodeMask('3056930009020004').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });

    it('returns STANDARD mask for JCB 3566002020360505', () => {
      expect(getSecurityCodeMask('3566002020360505').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });

    it('returns STANDARD mask for UnionPay 6200000000000005', () => {
      expect(getSecurityCodeMask('6200000000000005').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });

    it('returns STANDARD mask for partial Visa input', () => {
      expect(getSecurityCodeMask('4').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });

    it('returns STANDARD mask for partial Mastercard input', () => {
      expect(getSecurityCodeMask('51').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });
  });

  describe('edge cases for Diners Club vs Amex distinction', () => {
    it('returns STANDARD mask for Diners starting with 30', () => {
      expect(getSecurityCodeMask('30').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });

    it('returns STANDARD mask for Diners starting with 36', () => {
      expect(getSecurityCodeMask('36').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });

    it('returns STANDARD mask for Diners starting with 38', () => {
      expect(getSecurityCodeMask('38').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });

    it('returns AMEX mask for 34 prefix (not Diners)', () => {
      expect(getSecurityCodeMask('34').mask).toBe(SECURITY_CODE_MASKS.AMEX.mask);
    });

    it('returns AMEX mask for 37 prefix (not Diners)', () => {
      expect(getSecurityCodeMask('37').mask).toBe(SECURITY_CODE_MASKS.AMEX.mask);
    });

    it('returns STANDARD mask for JCB starting with 35', () => {
      expect(getSecurityCodeMask('35').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });
  });

  describe('mask format validation', () => {
    it('AMEX mask allows exactly 4 digits', () => {
      const digitCount = SECURITY_CODE_MASKS.AMEX.mask.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(4);
    });

    it('STANDARD mask allows exactly 3 digits', () => {
      const digitCount = SECURITY_CODE_MASKS.STANDARD.mask.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(3);
    });
  });
});
