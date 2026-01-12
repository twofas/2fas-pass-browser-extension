// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { getSecurityCodeMask, maxSecurityCodeLength, SECURITY_CODE_MASKS } from './getSecurityCodeMask';
import { CARD_ISSUER } from '../PaymentCardNumberInput/getCardNumberMask';

describe('maxSecurityCodeLength', () => {
  it('returns 4 for American Express', () => {
    expect(maxSecurityCodeLength(CARD_ISSUER.AMERICAN_EXPRESS)).toBe(4);
  });

  it('returns 3 for Visa', () => {
    expect(maxSecurityCodeLength(CARD_ISSUER.VISA)).toBe(3);
  });

  it('returns 3 for Mastercard', () => {
    expect(maxSecurityCodeLength(CARD_ISSUER.MASTERCARD)).toBe(3);
  });

  it('returns 3 for Discover', () => {
    expect(maxSecurityCodeLength(CARD_ISSUER.DISCOVER)).toBe(3);
  });

  it('returns 3 for Diners Club', () => {
    expect(maxSecurityCodeLength(CARD_ISSUER.DINERS_CLUB)).toBe(3);
  });

  it('returns 3 for JCB', () => {
    expect(maxSecurityCodeLength(CARD_ISSUER.JCB)).toBe(3);
  });

  it('returns 3 for UnionPay', () => {
    expect(maxSecurityCodeLength(CARD_ISSUER.UNION_PAY)).toBe(3);
  });

  it('returns 4 for null (unknown issuer)', () => {
    expect(maxSecurityCodeLength(null)).toBe(4);
  });
});

describe('getSecurityCodeMask', () => {
  describe('empty/null input (defaults to 4-digit like iOS)', () => {
    it('returns AMEX mask for null input', () => {
      expect(getSecurityCodeMask(null)).toEqual({ ...SECURITY_CODE_MASKS.AMEX });
    });

    it('returns AMEX mask for undefined input', () => {
      expect(getSecurityCodeMask(undefined)).toEqual({ ...SECURITY_CODE_MASKS.AMEX });
    });

    it('returns AMEX mask for empty string', () => {
      expect(getSecurityCodeMask('')).toEqual({ ...SECURITY_CODE_MASKS.AMEX });
    });

    it('returns AMEX mask for string with only spaces', () => {
      expect(getSecurityCodeMask('    ')).toEqual({ ...SECURITY_CODE_MASKS.AMEX });
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
      expect(getSecurityCodeMask('300').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
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
      expect(getSecurityCodeMask('3528').mask).toBe(SECURITY_CODE_MASKS.STANDARD.mask);
    });
  });

  describe('unrecognized card types (defaults to 4-digit like iOS)', () => {
    it('returns AMEX mask for unrecognized prefix 9', () => {
      expect(getSecurityCodeMask('9999').mask).toBe(SECURITY_CODE_MASKS.AMEX.mask);
    });

    it('returns AMEX mask for unrecognized prefix 1', () => {
      expect(getSecurityCodeMask('1111').mask).toBe(SECURITY_CODE_MASKS.AMEX.mask);
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
