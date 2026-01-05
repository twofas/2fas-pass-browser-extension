// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { getCardNumberMask, detectCardIssuer, maxCardNumberLength, CARD_MASKS, CARD_ISSUER } from './getCardNumberMask';

describe('detectCardIssuer', () => {
  describe('empty/null input', () => {
    it('returns null for null input', () => {
      expect(detectCardIssuer(null)).toBe(null);
    });

    it('returns null for undefined input', () => {
      expect(detectCardIssuer(undefined)).toBe(null);
    });

    it('returns null for empty string', () => {
      expect(detectCardIssuer('')).toBe(null);
    });

    it('returns null for string with only spaces', () => {
      expect(detectCardIssuer('    ')).toBe(null);
    });
  });

  describe('Visa detection', () => {
    it('detects Visa from prefix 4', () => {
      expect(detectCardIssuer('4')).toBe(CARD_ISSUER.VISA);
      expect(detectCardIssuer('4242424242424242')).toBe(CARD_ISSUER.VISA);
      expect(detectCardIssuer('4000056655665556')).toBe(CARD_ISSUER.VISA);
    });
  });

  describe('Mastercard detection', () => {
    it('detects Mastercard from 51-55 range', () => {
      expect(detectCardIssuer('51')).toBe(CARD_ISSUER.MASTERCARD);
      expect(detectCardIssuer('52')).toBe(CARD_ISSUER.MASTERCARD);
      expect(detectCardIssuer('53')).toBe(CARD_ISSUER.MASTERCARD);
      expect(detectCardIssuer('54')).toBe(CARD_ISSUER.MASTERCARD);
      expect(detectCardIssuer('55')).toBe(CARD_ISSUER.MASTERCARD);
      expect(detectCardIssuer('5555555555554444')).toBe(CARD_ISSUER.MASTERCARD);
    });

    it('detects Mastercard from 2221-2720 range', () => {
      expect(detectCardIssuer('2221')).toBe(CARD_ISSUER.MASTERCARD);
      expect(detectCardIssuer('2500')).toBe(CARD_ISSUER.MASTERCARD);
      expect(detectCardIssuer('2720')).toBe(CARD_ISSUER.MASTERCARD);
      expect(detectCardIssuer('2223003122003222')).toBe(CARD_ISSUER.MASTERCARD);
    });

    it('does not detect Mastercard from outside 2221-2720 range', () => {
      expect(detectCardIssuer('2220')).not.toBe(CARD_ISSUER.MASTERCARD);
      expect(detectCardIssuer('2721')).not.toBe(CARD_ISSUER.MASTERCARD);
    });
  });

  describe('American Express detection', () => {
    it('detects Amex from 34 prefix', () => {
      expect(detectCardIssuer('34')).toBe(CARD_ISSUER.AMERICAN_EXPRESS);
      expect(detectCardIssuer('341111111111111')).toBe(CARD_ISSUER.AMERICAN_EXPRESS);
    });

    it('detects Amex from 37 prefix', () => {
      expect(detectCardIssuer('37')).toBe(CARD_ISSUER.AMERICAN_EXPRESS);
      expect(detectCardIssuer('378282246310005')).toBe(CARD_ISSUER.AMERICAN_EXPRESS);
      expect(detectCardIssuer('371449635398431')).toBe(CARD_ISSUER.AMERICAN_EXPRESS);
    });
  });

  describe('Discover detection', () => {
    it('detects Discover from 6011 prefix', () => {
      expect(detectCardIssuer('6011')).toBe(CARD_ISSUER.DISCOVER);
      expect(detectCardIssuer('6011111111111117')).toBe(CARD_ISSUER.DISCOVER);
    });

    it('detects Discover from 65 prefix', () => {
      expect(detectCardIssuer('65')).toBe(CARD_ISSUER.DISCOVER);
      expect(detectCardIssuer('6500000000000002')).toBe(CARD_ISSUER.DISCOVER);
    });

    it('detects Discover from 644-649 range', () => {
      expect(detectCardIssuer('644')).toBe(CARD_ISSUER.DISCOVER);
      expect(detectCardIssuer('645')).toBe(CARD_ISSUER.DISCOVER);
      expect(detectCardIssuer('646')).toBe(CARD_ISSUER.DISCOVER);
      expect(detectCardIssuer('647')).toBe(CARD_ISSUER.DISCOVER);
      expect(detectCardIssuer('648')).toBe(CARD_ISSUER.DISCOVER);
      expect(detectCardIssuer('649')).toBe(CARD_ISSUER.DISCOVER);
    });

    it('detects Discover from 622126-622925 range', () => {
      expect(detectCardIssuer('622126')).toBe(CARD_ISSUER.DISCOVER);
      expect(detectCardIssuer('622500')).toBe(CARD_ISSUER.DISCOVER);
      expect(detectCardIssuer('622925')).toBe(CARD_ISSUER.DISCOVER);
    });

    it('does not detect Discover from outside 622126-622925 range', () => {
      expect(detectCardIssuer('622125')).not.toBe(CARD_ISSUER.DISCOVER);
      expect(detectCardIssuer('622926')).not.toBe(CARD_ISSUER.DISCOVER);
    });
  });

  describe('Diners Club detection', () => {
    it('detects Diners Club from 36 prefix', () => {
      expect(detectCardIssuer('36')).toBe(CARD_ISSUER.DINERS_CLUB);
      expect(detectCardIssuer('36227206271667')).toBe(CARD_ISSUER.DINERS_CLUB);
    });

    it('detects Diners Club from 38 prefix', () => {
      expect(detectCardIssuer('38')).toBe(CARD_ISSUER.DINERS_CLUB);
    });

    it('detects Diners Club from 39 prefix', () => {
      expect(detectCardIssuer('39')).toBe(CARD_ISSUER.DINERS_CLUB);
    });

    it('detects Diners Club from 300-305 range', () => {
      expect(detectCardIssuer('300')).toBe(CARD_ISSUER.DINERS_CLUB);
      expect(detectCardIssuer('301')).toBe(CARD_ISSUER.DINERS_CLUB);
      expect(detectCardIssuer('302')).toBe(CARD_ISSUER.DINERS_CLUB);
      expect(detectCardIssuer('303')).toBe(CARD_ISSUER.DINERS_CLUB);
      expect(detectCardIssuer('304')).toBe(CARD_ISSUER.DINERS_CLUB);
      expect(detectCardIssuer('305')).toBe(CARD_ISSUER.DINERS_CLUB);
      expect(detectCardIssuer('3056930009020004')).toBe(CARD_ISSUER.DINERS_CLUB);
    });
  });

  describe('JCB detection', () => {
    it('detects JCB from 3528-3589 range', () => {
      expect(detectCardIssuer('3528')).toBe(CARD_ISSUER.JCB);
      expect(detectCardIssuer('3550')).toBe(CARD_ISSUER.JCB);
      expect(detectCardIssuer('3589')).toBe(CARD_ISSUER.JCB);
      expect(detectCardIssuer('3566002020360505')).toBe(CARD_ISSUER.JCB);
    });

    it('does not detect JCB from outside 3528-3589 range', () => {
      expect(detectCardIssuer('3527')).not.toBe(CARD_ISSUER.JCB);
      expect(detectCardIssuer('3590')).not.toBe(CARD_ISSUER.JCB);
    });
  });

  describe('UnionPay detection', () => {
    it('detects UnionPay from 62 prefix', () => {
      expect(detectCardIssuer('62')).toBe(CARD_ISSUER.UNION_PAY);
      expect(detectCardIssuer('6200000000000005')).toBe(CARD_ISSUER.UNION_PAY);
      expect(detectCardIssuer('6205500000000000004')).toBe(CARD_ISSUER.UNION_PAY);
    });
  });

  describe('unrecognized card types', () => {
    it('returns null for unrecognized prefixes', () => {
      expect(detectCardIssuer('9999999999999999')).toBe(null);
      expect(detectCardIssuer('1111111111111111')).toBe(null);
    });
  });

  describe('input with spaces', () => {
    it('handles input with spaces', () => {
      expect(detectCardIssuer('4242 4242 4242 4242')).toBe(CARD_ISSUER.VISA);
      expect(detectCardIssuer('3782 822463 10005')).toBe(CARD_ISSUER.AMERICAN_EXPRESS);
    });
  });
});

describe('maxCardNumberLength', () => {
  it('returns 16 for Visa', () => {
    expect(maxCardNumberLength(CARD_ISSUER.VISA)).toBe(16);
  });

  it('returns 16 for Mastercard', () => {
    expect(maxCardNumberLength(CARD_ISSUER.MASTERCARD)).toBe(16);
  });

  it('returns 16 for JCB', () => {
    expect(maxCardNumberLength(CARD_ISSUER.JCB)).toBe(16);
  });

  it('returns 15 for American Express', () => {
    expect(maxCardNumberLength(CARD_ISSUER.AMERICAN_EXPRESS)).toBe(15);
  });

  it('returns 19 for Discover', () => {
    expect(maxCardNumberLength(CARD_ISSUER.DISCOVER)).toBe(19);
  });

  it('returns 19 for Diners Club', () => {
    expect(maxCardNumberLength(CARD_ISSUER.DINERS_CLUB)).toBe(19);
  });

  it('returns 19 for UnionPay', () => {
    expect(maxCardNumberLength(CARD_ISSUER.UNION_PAY)).toBe(19);
  });

  it('returns 19 for null (unknown issuer)', () => {
    expect(maxCardNumberLength(null)).toBe(19);
  });
});

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

    it('detects Mastercard 2-series boundary values (2221-2720 range)', () => {
      expect(getCardNumberMask('2221')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('2229')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('2300')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('2699')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('2700')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('2710')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('2720')).toBe(CARD_MASKS.STANDARD_16);
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

  describe('Discover cards (19 digits, 4-4-4-4-3 format)', () => {
    it('detects Discover from Stripe test card 6011111111111117', () => {
      expect(getCardNumberMask('6011111111111117')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects Discover from Stripe test card 6011000990139424', () => {
      expect(getCardNumberMask('6011000990139424')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects Discover from partial input 6011 prefix', () => {
      expect(getCardNumberMask('6011')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects Discover from partial input 65 prefix', () => {
      expect(getCardNumberMask('65')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects Discover from partial input 644-649 range', () => {
      expect(getCardNumberMask('644')).toBe(CARD_MASKS.STANDARD_19);
      expect(getCardNumberMask('645')).toBe(CARD_MASKS.STANDARD_19);
      expect(getCardNumberMask('646')).toBe(CARD_MASKS.STANDARD_19);
      expect(getCardNumberMask('647')).toBe(CARD_MASKS.STANDARD_19);
      expect(getCardNumberMask('648')).toBe(CARD_MASKS.STANDARD_19);
      expect(getCardNumberMask('649')).toBe(CARD_MASKS.STANDARD_19);
    });
  });

  describe('Diners Club cards (19 digits, 4-4-4-4-3 format)', () => {
    it('detects Diners Club from Stripe test card 3056930009020004', () => {
      expect(getCardNumberMask('3056930009020004')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects Diners Club from Stripe test card 36227206271667', () => {
      expect(getCardNumberMask('36227206271667')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects Diners Club from partial input 300-305 range', () => {
      expect(getCardNumberMask('300')).toBe(CARD_MASKS.STANDARD_19);
      expect(getCardNumberMask('301')).toBe(CARD_MASKS.STANDARD_19);
      expect(getCardNumberMask('302')).toBe(CARD_MASKS.STANDARD_19);
      expect(getCardNumberMask('303')).toBe(CARD_MASKS.STANDARD_19);
      expect(getCardNumberMask('304')).toBe(CARD_MASKS.STANDARD_19);
      expect(getCardNumberMask('305')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects Diners Club from partial input 36 prefix', () => {
      expect(getCardNumberMask('36')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects Diners Club from partial input 38 prefix', () => {
      expect(getCardNumberMask('38')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects Diners Club from partial input 39 prefix', () => {
      expect(getCardNumberMask('39')).toBe(CARD_MASKS.STANDARD_19);
    });
  });

  describe('JCB cards (16 digits, 4-4-4-4 format)', () => {
    it('detects JCB from Stripe test card 3566002020360505', () => {
      expect(getCardNumberMask('3566002020360505')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects JCB from Stripe Japan test card 3530111333300000', () => {
      expect(getCardNumberMask('3530111333300000')).toBe(CARD_MASKS.STANDARD_16);
    });

    it('detects JCB boundary values (3528-3589 range)', () => {
      expect(getCardNumberMask('3528')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('3529')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('3530')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('3580')).toBe(CARD_MASKS.STANDARD_16);
      expect(getCardNumberMask('3589')).toBe(CARD_MASKS.STANDARD_16);
    });
  });

  describe('UnionPay cards (19 digits, 4-4-4-4-3 format)', () => {
    it('detects UnionPay from Stripe test card 6200000000000005', () => {
      expect(getCardNumberMask('6200000000000005')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects UnionPay debit from Stripe test card 6200000000000047', () => {
      expect(getCardNumberMask('6200000000000047')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects UnionPay from Stripe test card 6205500000000000004', () => {
      expect(getCardNumberMask('6205500000000000004')).toBe(CARD_MASKS.STANDARD_19);
    });

    it('detects UnionPay from partial input 62 prefix', () => {
      expect(getCardNumberMask('62')).toBe(CARD_MASKS.STANDARD_19);
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

    it('STANDARD_16 mask allows exactly 16 digits', () => {
      const digitCount = CARD_MASKS.STANDARD_16.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(16);
    });

    it('STANDARD_19 mask allows exactly 19 digits', () => {
      const digitCount = CARD_MASKS.STANDARD_19.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(19);
    });

    it('DEFAULT mask allows exactly 19 digits', () => {
      const digitCount = CARD_MASKS.DEFAULT.replace(/[^9]/g, '').length;
      expect(digitCount).toBe(19);
    });
  });
});
