// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { getCardNumberMask, CARD_MASKS } from './getCardNumberMask';

describe('getCardNumberMask', () => {
  describe('empty/null input', () => {
    it('returns DEFAULT mask for null input', () => {
      expect(getCardNumberMask(null)).toEqual({ ...CARD_MASKS.DEFAULT, cardType: null });
    });

    it('returns DEFAULT mask for undefined input', () => {
      expect(getCardNumberMask(undefined)).toEqual({ ...CARD_MASKS.DEFAULT, cardType: null });
    });

    it('returns DEFAULT mask for empty string', () => {
      expect(getCardNumberMask('')).toEqual({ ...CARD_MASKS.DEFAULT, cardType: null });
    });

    it('returns DEFAULT mask for string with only spaces', () => {
      expect(getCardNumberMask('    ')).toEqual({ ...CARD_MASKS.DEFAULT, cardType: null });
    });
  });

  describe('Visa cards (16 digits, 4-4-4-4 format)', () => {
    it('detects Visa from Stripe test card 4242424242424242', () => {
      const result = getCardNumberMask('4242424242424242');
      expect(result.cardType).toBe('visa');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Visa debit from Stripe test card 4000056655665556', () => {
      const result = getCardNumberMask('4000056655665556');
      expect(result.cardType).toBe('visa');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Visa from partial input starting with 4', () => {
      expect(getCardNumberMask('4').cardType).toBe('visa');
      expect(getCardNumberMask('42').cardType).toBe('visa');
      expect(getCardNumberMask('424').cardType).toBe('visa');
    });
  });

  describe('Mastercard cards (16 digits, 4-4-4-4 format)', () => {
    it('detects Mastercard from Stripe test card 5555555555554444', () => {
      const result = getCardNumberMask('5555555555554444');
      expect(result.cardType).toBe('mastercard');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Mastercard 2-series from Stripe test card 2223003122003222', () => {
      const result = getCardNumberMask('2223003122003222');
      expect(result.cardType).toBe('mastercard');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Mastercard debit from Stripe test card 5200828282828210', () => {
      const result = getCardNumberMask('5200828282828210');
      expect(result.cardType).toBe('mastercard');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Mastercard prepaid from Stripe test card 5105105105105100', () => {
      const result = getCardNumberMask('5105105105105100');
      expect(result.cardType).toBe('mastercard');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Mastercard from partial input 51-55 range', () => {
      expect(getCardNumberMask('51').cardType).toBe('mastercard');
      expect(getCardNumberMask('52').cardType).toBe('mastercard');
      expect(getCardNumberMask('53').cardType).toBe('mastercard');
      expect(getCardNumberMask('54').cardType).toBe('mastercard');
      expect(getCardNumberMask('55').cardType).toBe('mastercard');
    });

    it('detects Mastercard from partial input 22-27 range', () => {
      expect(getCardNumberMask('22').cardType).toBe('mastercard');
      expect(getCardNumberMask('23').cardType).toBe('mastercard');
      expect(getCardNumberMask('24').cardType).toBe('mastercard');
      expect(getCardNumberMask('25').cardType).toBe('mastercard');
      expect(getCardNumberMask('26').cardType).toBe('mastercard');
      expect(getCardNumberMask('27').cardType).toBe('mastercard');
    });
  });

  describe('American Express cards (15 digits, 4-6-5 format)', () => {
    it('detects Amex from Stripe test card 378282246310005', () => {
      const result = getCardNumberMask('378282246310005');
      expect(result.cardType).toBe('amex');
      expect(result.mask).toBe(CARD_MASKS.AMEX.mask);
    });

    it('detects Amex from Stripe test card 371449635398431', () => {
      const result = getCardNumberMask('371449635398431');
      expect(result.cardType).toBe('amex');
      expect(result.mask).toBe(CARD_MASKS.AMEX.mask);
    });

    it('detects Amex from partial input 34 prefix', () => {
      expect(getCardNumberMask('34').cardType).toBe('amex');
    });

    it('detects Amex from partial input 37 prefix', () => {
      expect(getCardNumberMask('37').cardType).toBe('amex');
    });
  });

  describe('Discover cards (16 digits, 4-4-4-4 format)', () => {
    it('detects Discover from Stripe test card 6011111111111117', () => {
      const result = getCardNumberMask('6011111111111117');
      expect(result.cardType).toBe('discover');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Discover from Stripe test card 6011000990139424', () => {
      const result = getCardNumberMask('6011000990139424');
      expect(result.cardType).toBe('discover');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Discover debit from Stripe test card 6011981111111113', () => {
      const result = getCardNumberMask('6011981111111113');
      expect(result.cardType).toBe('discover');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Discover from partial input 6011 prefix', () => {
      expect(getCardNumberMask('6011').cardType).toBe('discover');
    });

    it('detects Discover from partial input 65 prefix', () => {
      expect(getCardNumberMask('65').cardType).toBe('discover');
    });

    it('detects Discover from partial input 644-649 range', () => {
      expect(getCardNumberMask('644').cardType).toBe('discover');
      expect(getCardNumberMask('645').cardType).toBe('discover');
      expect(getCardNumberMask('646').cardType).toBe('discover');
      expect(getCardNumberMask('647').cardType).toBe('discover');
      expect(getCardNumberMask('648').cardType).toBe('discover');
      expect(getCardNumberMask('649').cardType).toBe('discover');
    });
  });

  describe('Diners Club cards (14 or 16 digits)', () => {
    it('detects Diners Club from Stripe test card 3056930009020004 (16 digits)', () => {
      const result = getCardNumberMask('3056930009020004');
      expect(result.cardType).toBe('diners');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Diners Club 14-digit from Stripe test card 36227206271667', () => {
      const result = getCardNumberMask('36227206271667');
      expect(result.cardType).toBe('diners');
      expect(result.mask).toBe(CARD_MASKS.DINERS_14.mask);
    });

    it('detects Diners Club from partial input 300-305 range', () => {
      expect(getCardNumberMask('300').cardType).toBe('diners');
      expect(getCardNumberMask('301').cardType).toBe('diners');
      expect(getCardNumberMask('302').cardType).toBe('diners');
      expect(getCardNumberMask('303').cardType).toBe('diners');
      expect(getCardNumberMask('304').cardType).toBe('diners');
      expect(getCardNumberMask('305').cardType).toBe('diners');
    });

    it('detects Diners Club from partial input 36 prefix', () => {
      expect(getCardNumberMask('36').cardType).toBe('diners');
    });

    it('detects Diners Club from partial input 38 prefix', () => {
      expect(getCardNumberMask('38').cardType).toBe('diners');
    });

    it('detects Diners Club from partial input 39 prefix', () => {
      expect(getCardNumberMask('39').cardType).toBe('diners');
    });

    it('uses 14-digit mask for Diners Club cards with 14 or fewer digits', () => {
      expect(getCardNumberMask('36227206271667').mask).toBe(CARD_MASKS.DINERS_14.mask);
      expect(getCardNumberMask('3622720627166').mask).toBe(CARD_MASKS.DINERS_14.mask);
    });

    it('uses 16-digit mask for Diners Club cards with more than 14 digits', () => {
      expect(getCardNumberMask('362272062716670').mask).toBe(CARD_MASKS.STANDARD_16.mask);
      expect(getCardNumberMask('3622720627166700').mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });
  });

  describe('JCB cards (16 digits, 4-4-4-4 format)', () => {
    it('detects JCB from Stripe test card 3566002020360505', () => {
      const result = getCardNumberMask('3566002020360505');
      expect(result.cardType).toBe('jcb');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects JCB from Stripe Japan test card 3530111333300000', () => {
      const result = getCardNumberMask('3530111333300000');
      expect(result.cardType).toBe('jcb');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects JCB from partial input 35 prefix', () => {
      expect(getCardNumberMask('35').cardType).toBe('jcb');
    });
  });

  describe('UnionPay cards (16 or 19 digits)', () => {
    it('detects UnionPay 16-digit from Stripe test card 6200000000000005', () => {
      const result = getCardNumberMask('6200000000000005');
      expect(result.cardType).toBe('unionpay');
      expect(result.mask).toBe(CARD_MASKS.UNIONPAY_16.mask);
    });

    it('detects UnionPay debit 16-digit from Stripe test card 6200000000000047', () => {
      const result = getCardNumberMask('6200000000000047');
      expect(result.cardType).toBe('unionpay');
      expect(result.mask).toBe(CARD_MASKS.UNIONPAY_16.mask);
    });

    it('detects UnionPay 19-digit from Stripe test card 6205500000000000004', () => {
      const result = getCardNumberMask('6205500000000000004');
      expect(result.cardType).toBe('unionpay');
      expect(result.mask).toBe(CARD_MASKS.UNIONPAY_19.mask);
    });

    it('detects UnionPay from partial input 62 prefix', () => {
      expect(getCardNumberMask('62').cardType).toBe('unionpay');
    });

    it('uses 19-digit mask for UnionPay cards starting with 62055', () => {
      expect(getCardNumberMask('62055').mask).toBe(CARD_MASKS.UNIONPAY_19.mask);
      expect(getCardNumberMask('620550').mask).toBe(CARD_MASKS.UNIONPAY_19.mask);
      expect(getCardNumberMask('6205500').mask).toBe(CARD_MASKS.UNIONPAY_19.mask);
    });

    it('uses 16-digit mask for UnionPay cards NOT starting with 62055', () => {
      expect(getCardNumberMask('6200').mask).toBe(CARD_MASKS.UNIONPAY_16.mask);
      expect(getCardNumberMask('62000').mask).toBe(CARD_MASKS.UNIONPAY_16.mask);
      expect(getCardNumberMask('62001').mask).toBe(CARD_MASKS.UNIONPAY_16.mask);
    });
  });

  describe('BCcard and DinaCard (16 digits, 4-4-4-4 format)', () => {
    it('detects BCcard from Stripe test card 6555900000604105', () => {
      const result = getCardNumberMask('6555900000604105');
      expect(result.cardType).toBe('bccard');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects BCcard from partial input 6555 prefix', () => {
      expect(getCardNumberMask('6555').cardType).toBe('bccard');
    });
  });

  describe('Carnet cards (16 digits, 4-4-4-4 format)', () => {
    it('detects Carnet from Stripe Mexico test card 5062210000000009', () => {
      const result = getCardNumberMask('5062210000000009');
      expect(result.cardType).toBe('carnet');
      expect(result.mask).toBe(CARD_MASKS.STANDARD_16.mask);
    });

    it('detects Carnet from partial input 5062 prefix', () => {
      expect(getCardNumberMask('5062').cardType).toBe('carnet');
    });
  });

  describe('input with spaces and formatting', () => {
    it('handles input with spaces', () => {
      expect(getCardNumberMask('4242 4242 4242 4242').cardType).toBe('visa');
      expect(getCardNumberMask('3782 822463 10005').cardType).toBe('amex');
    });

    it('handles input with dashes', () => {
      expect(getCardNumberMask('4242-4242-4242-4242').cardType).toBe('visa');
    });

    it('handles input with mixed formatting', () => {
      expect(getCardNumberMask('4242 4242-4242 4242').cardType).toBe('visa');
    });
  });

  describe('unrecognized card types', () => {
    it('returns DEFAULT mask for unrecognized prefix 9', () => {
      const result = getCardNumberMask('9999999999999999');
      expect(result.cardType).toBe(null);
      expect(result.mask).toBe(CARD_MASKS.DEFAULT.mask);
    });

    it('returns DEFAULT mask for unrecognized prefix 1', () => {
      const result = getCardNumberMask('1111111111111111');
      expect(result.cardType).toBe(null);
      expect(result.mask).toBe(CARD_MASKS.DEFAULT.mask);
    });
  });

  describe('mask format validation', () => {
    it('AMEX mask allows exactly 15 digits', () => {
      const digitCount = CARD_MASKS.AMEX.mask.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(15);
    });

    it('DINERS_14 mask allows exactly 14 digits', () => {
      const digitCount = CARD_MASKS.DINERS_14.mask.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(14);
    });

    it('UNIONPAY_16 mask allows exactly 16 digits', () => {
      const digitCount = CARD_MASKS.UNIONPAY_16.mask.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(16);
    });

    it('UNIONPAY_19 mask allows exactly 19 digits', () => {
      const digitCount = CARD_MASKS.UNIONPAY_19.mask.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(19);
    });

    it('STANDARD_16 mask allows exactly 16 digits', () => {
      const digitCount = CARD_MASKS.STANDARD_16.mask.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(16);
    });
  });
});
