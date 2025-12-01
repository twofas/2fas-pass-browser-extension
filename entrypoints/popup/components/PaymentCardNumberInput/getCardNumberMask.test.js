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
      expect(getCardNumberMask(null)).toBe(CARD_MASKS.DEFAULT);
    });

    it('returns DEFAULT mask for undefined input', () => {
      expect(getCardNumberMask(undefined)).toBe(CARD_MASKS.DEFAULT);
    });

    it('returns DEFAULT mask for empty string', () => {
      expect(getCardNumberMask('')).toBe(CARD_MASKS.DEFAULT);
    });

    it('returns DEFAULT mask for string with only spaces', () => {
      expect(getCardNumberMask('    ')).toBe(CARD_MASKS.DEFAULT);
    });
  });

  describe('Visa cards (16 digits, 4-4-4-4 format)', () => {
    it('detects Visa from Stripe test card 4242424242424242', () => {
      expect(getCardNumberMask('4242424242424242')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Visa debit from Stripe test card 4000056655665556', () => {
      expect(getCardNumberMask('4000056655665556')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Visa from partial input starting with 4', () => {
      expect(getCardNumberMask('4')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('42')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('424')).toBe(CARD_MASKS.STANDARD_16);
    });
  });

  describe('Mastercard cards (16 digits, 4-4-4-4 format)', () => {
    it('detects Mastercard from Stripe test card 5555555555554444', () => {
      expect(getCardNumberMask('5555555555554444')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Mastercard 2-series from Stripe test card 2223003122003222', () => {
      expect(getCardNumberMask('2223003122003222')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Mastercard debit from Stripe test card 5200828282828210', () => {
      expect(getCardNumberMask('5200828282828210')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Mastercard prepaid from Stripe test card 5105105105105100', () => {
      expect(getCardNumberMask('5105105105105100')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Mastercard from partial input 51-55 range', () => {
      expect(getCardNumberMask('51')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('52')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('53')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('54')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('55')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Mastercard from partial input 22-27 range', () => {
      expect(getCardNumberMask('22')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('23')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('24')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('25')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('26')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('27')).toBe(CARD_MASKS.STANDARD_16);
    });
  });

  describe('American Express cards (15 digits, 4-6-5 format)', () => {
    it('detects Amex from Stripe test card 378282246310005', () => {
      expect(getCardNumberMask('378282246310005')).toBe(CARD_MASKS.AMEX);
    });

    it('detects Amex from Stripe test card 371449635398431', () => {
      expect(getCardNumberMask('371449635398431')).toBe(CARD_MASKS.AMEX);
    });

    it('detects Amex from partial input 34 prefix', () => {
      expect(getCardNumberMask('34')).toBe(CARD_MASKS.AMEX);
    });

    it('detects Amex from partial input 37 prefix', () => {
      expect(getCardNumberMask('37')).toBe(CARD_MASKS.AMEX);
    });
  });

  describe('Discover cards (16 digits, 4-4-4-4 format)', () => {
    it('detects Discover from Stripe test card 6011111111111117', () => {
      expect(getCardNumberMask('6011111111111117')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Discover from Stripe test card 6011000990139424', () => {
      expect(getCardNumberMask('6011000990139424')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Discover debit from Stripe test card 6011981111111113', () => {
      expect(getCardNumberMask('6011981111111113')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Discover from partial input 6011 prefix', () => {
      expect(getCardNumberMask('6011')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Discover from partial input 65 prefix', () => {
      expect(getCardNumberMask('65')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Discover from partial input 644-649 range', () => {
      expect(getCardNumberMask('644')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('645')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('646')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('647')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('648')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('649')).toBe(CARD_MASKS.STANDARD_16);
    });
  });

  describe('Diners Club cards (14 or 16 digits)', () => {
    it('detects Diners Club from Stripe test card 3056930009020004 (16 digits)', () => {
      expect(getCardNumberMask('3056930009020004')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Diners Club 14-digit from Stripe test card 36227206271667', () => {
      expect(getCardNumberMask('36227206271667')).toBe(CARD_MASKS.DINERS_14);
    });

    it('detects Diners Club from partial input 300-305 range', () => {
      expect(getCardNumberMask('300')).toBe(CARD_MASKS.DINERS_14);
      expect(getCardNumberMask('301')).toBe(CARD_MASKS.DINERS_14);
      expect(getCardNumberMask('302')).toBe(CARD_MASKS.DINERS_14);
      expect(getCardNumberMask('303')).toBe(CARD_MASKS.DINERS_14);
      expect(getCardNumberMask('304')).toBe(CARD_MASKS.DINERS_14);
      expect(getCardNumberMask('305')).toBe(CARD_MASKS.DINERS_14);
    });

    it('detects Diners Club from partial input 36 prefix', () => {
      expect(getCardNumberMask('36')).toBe(CARD_MASKS.DINERS_14);
    });

    it('detects Diners Club from partial input 38 prefix', () => {
      expect(getCardNumberMask('38')).toBe(CARD_MASKS.DINERS_14);
    });

    it('detects Diners Club from partial input 39 prefix', () => {
      expect(getCardNumberMask('39')).toBe(CARD_MASKS.DINERS_14);
    });

    it('uses 14-digit mask for Diners Club cards with 14 or fewer digits', () => {
      expect(getCardNumberMask('36227206271667')).toBe(CARD_MASKS.DINERS_14);
      expect(getCardNumberMask('3622720627166')).toBe(CARD_MASKS.DINERS_14);
    });

    it('uses 16-digit mask for Diners Club cards with more than 14 digits', () => {
      expect(getCardNumberMask('362272062716670')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('3622720627166700')).toBe(CARD_MASKS.STANDARD_16);
    });
  });

  describe('JCB cards (16 digits, 4-4-4-4 format)', () => {
    it('detects JCB from Stripe test card 3566002020360505', () => {
      expect(getCardNumberMask('3566002020360505')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects JCB from Stripe Japan test card 3530111333300000', () => {
      expect(getCardNumberMask('3530111333300000')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects JCB from partial input 35 prefix', () => {
      expect(getCardNumberMask('35')).toBe(CARD_MASKS.STANDARD_16);
    });
  });

  describe('UnionPay cards (16 or 19 digits)', () => {
    it('detects UnionPay 16-digit from Stripe test card 6200000000000005', () => {
      expect(getCardNumberMask('6200000000000005')).toBe(CARD_MASKS.UNIONPAY_16);
    });

    it('detects UnionPay debit 16-digit from Stripe test card 6200000000000047', () => {
      expect(getCardNumberMask('6200000000000047')).toBe(CARD_MASKS.UNIONPAY_16);
    });

    it('detects UnionPay 19-digit from Stripe test card 6205500000000000004', () => {
      expect(getCardNumberMask('6205500000000000004')).toBe(CARD_MASKS.UNIONPAY_19);
    });

    it('detects UnionPay from partial input 62 prefix', () => {
      expect(getCardNumberMask('62')).toBe(CARD_MASKS.UNIONPAY_16);
    });

    it('uses 19-digit mask for UnionPay cards starting with 62055', () => {
      expect(getCardNumberMask('62055')).toBe(CARD_MASKS.UNIONPAY_19);
      expect(getCardNumberMask('620550')).toBe(CARD_MASKS.UNIONPAY_19);
      expect(getCardNumberMask('6205500')).toBe(CARD_MASKS.UNIONPAY_19);
    });

    it('uses 16-digit mask for UnionPay cards NOT starting with 62055', () => {
      expect(getCardNumberMask('6200')).toBe(CARD_MASKS.UNIONPAY_16);
      expect(getCardNumberMask('62000')).toBe(CARD_MASKS.UNIONPAY_16);
      expect(getCardNumberMask('62001')).toBe(CARD_MASKS.UNIONPAY_16);
    });
  });

  describe('BCcard and DinaCard (16 digits, 4-4-4-4 format)', () => {
    it('detects BCcard from Stripe test card 6555900000604105', () => {
      expect(getCardNumberMask('6555900000604105')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects BCcard from partial input 6555 prefix', () => {
      expect(getCardNumberMask('6555')).toBe(CARD_MASKS.STANDARD_16);
    });
  });

  describe('Carnet cards (16 digits, 4-4-4-4 format)', () => {
    it('detects Carnet from Stripe Mexico test card 5062210000000009', () => {
      expect(getCardNumberMask('5062210000000009')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects Carnet from partial input 5062 prefix', () => {
      expect(getCardNumberMask('5062')).toBe(CARD_MASKS.STANDARD_16);
    });
  });

  describe('input with spaces and formatting', () => {
    it('handles input with spaces', () => {
      expect(getCardNumberMask('4242 4242 4242 4242')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('3782 822463 10005')).toBe(CARD_MASKS.AMEX);
    });

    it('handles input with dashes', () => {
      expect(getCardNumberMask('4242-4242-4242-4242')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('handles input with mixed formatting', () => {
      expect(getCardNumberMask('4242 4242-4242 4242')).toBe(CARD_MASKS.STANDARD_16);
    });
  });

  describe('unrecognized card types', () => {
    it('returns DEFAULT mask for unrecognized prefix 9', () => {
      expect(getCardNumberMask('9999999999999999')).toBe(CARD_MASKS.DEFAULT);
    });

    it('returns DEFAULT mask for unrecognized prefix 1', () => {
      expect(getCardNumberMask('1111111111111111')).toBe(CARD_MASKS.DEFAULT);
    });
  });

  describe('mask format validation', () => {
    it('AMEX mask allows exactly 15 digits', () => {
      const digitCount = CARD_MASKS.AMEX.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(15);
    });

    it('DINERS_14 mask allows exactly 14 digits', () => {
      const digitCount = CARD_MASKS.DINERS_14.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(14);
    });

    it('UNIONPAY_16 mask allows exactly 16 digits', () => {
      const digitCount = CARD_MASKS.UNIONPAY_16.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(16);
    });

    it('UNIONPAY_19 mask allows exactly 19 digits', () => {
      const digitCount = CARD_MASKS.UNIONPAY_19.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(19);
    });

    it('STANDARD_16 mask allows exactly 16 digits', () => {
      const digitCount = CARD_MASKS.STANDARD_16.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(16);
    });
  });
});
