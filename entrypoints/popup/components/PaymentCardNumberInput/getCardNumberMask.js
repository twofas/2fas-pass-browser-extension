// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Card type definitions with masks based on Stripe testing documentation.
 * Formats:
 * - Standard (16 digits): 4-4-4-4 (Visa, Mastercard, Discover, JCB, UnionPay 16)
 * - American Express (15 digits): 4-6-5
 * - Diners Club (14 digits): 4-6-4
 * - UnionPay (19 digits): 4-4-4-4-3
 */
const CARD_MASKS = {
  AMEX: {
    mask: '9999 999999 99999',
    placeholder: '0000 000000 00000'
  },
  DINERS_14: {
    mask: '9999 999999 9999',
    placeholder: '0000 000000 0000'
  },
  UNIONPAY_16: {
    mask: '9999 9999 9999 9999',
    placeholder: '0000 0000 0000 0000'
  },
  UNIONPAY_19: {
    mask: '9999 9999 9999 9999 999',
    placeholder: '0000 0000 0000 0000 000'
  },
  STANDARD_16: {
    mask: '9999 9999 9999 9999',
    placeholder: '0000 0000 0000 0000'
  },
  DEFAULT: {
    mask: '9999 9999 9999 9999',
    placeholder: '0000 0000 0000 0000'
  }
};

/**
 * Detects card type and returns appropriate mask based on card number prefix.
 * @param {string} cardNumber - The card number (can include spaces).
 * @returns {Object} Object with mask, placeholder, and cardType properties.
 */
const getCardNumberMask = cardNumber => {
  if (!cardNumber) {
    return { ...CARD_MASKS.DEFAULT, cardType: null };
  }

  const cleanNumber = cardNumber.replace(/\D/g, '');

  if (cleanNumber.length === 0) {
    return { ...CARD_MASKS.DEFAULT, cardType: null };
  }

  if (/^3[47]/.test(cleanNumber)) {
    return { ...CARD_MASKS.AMEX, cardType: 'amex' };
  }

  if (/^3(?:0[0-5]|[689])/.test(cleanNumber)) {
    if (cleanNumber.length > 14) {
      return { ...CARD_MASKS.STANDARD_16, cardType: 'diners' };
    }

    return { ...CARD_MASKS.DINERS_14, cardType: 'diners' };
  }

  if (/^62/.test(cleanNumber)) {
    if (/^62055/.test(cleanNumber)) {
      return { ...CARD_MASKS.UNIONPAY_19, cardType: 'unionpay' };
    }

    return { ...CARD_MASKS.UNIONPAY_16, cardType: 'unionpay' };
  }

  if (/^4/.test(cleanNumber)) {
    return { ...CARD_MASKS.STANDARD_16, cardType: 'visa' };
  }

  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) {
    return { ...CARD_MASKS.STANDARD_16, cardType: 'mastercard' };
  }

  if (/^6555/.test(cleanNumber)) {
    return { ...CARD_MASKS.STANDARD_16, cardType: 'bccard' };
  }

  if (/^6(?:011|5|4[4-9])/.test(cleanNumber)) {
    return { ...CARD_MASKS.STANDARD_16, cardType: 'discover' };
  }

  if (/^35/.test(cleanNumber)) {
    return { ...CARD_MASKS.STANDARD_16, cardType: 'jcb' };
  }

  if (/^5062/.test(cleanNumber)) {
    return { ...CARD_MASKS.STANDARD_16, cardType: 'carnet' };
  }

  return { ...CARD_MASKS.DEFAULT, cardType: null };
};

export { getCardNumberMask, CARD_MASKS };
export default getCardNumberMask;
