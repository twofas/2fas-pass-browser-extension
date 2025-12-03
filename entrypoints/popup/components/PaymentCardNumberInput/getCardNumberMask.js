// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Card type definitions with masks based on Stripe testing documentation.
 * Formats:
 * - Standard (16 digits): 4-4-4-4 (Visa, Mastercard, Discover, JCB, UnionPay 16, Diners Club 16)
 * - American Express (15 digits): 4-6-5
 * - Diners Club (14 digits): 4-6-4
 * - UnionPay (19 digits): 4-4-4-4-3
 *
 * Card brand prefixes (based on Stripe testing documentation):
 * - Visa: 4
 * - Mastercard: 51-55, 2221-2720
 * - American Express: 34, 37
 * - Discover: 6011, 622126-622925, 644-649, 65
 * - JCB: 3528-3589
 * - Diners Club (14-digit): 36
 * - Diners Club (16-digit): 300-305, 3095, 38, 39
 * - UnionPay: 62 (various ranges)
 * - Carnet: 5062
 * - BCcard/DinaCard: 6555
 */
const CARD_MASKS = {
  AMEX: '9999 999999 99999',
  DINERS_14: '9999 999999 9999',
  UNIONPAY_16: '9999 9999 9999 9999',
  UNIONPAY_19: '9999 9999 9999 9999 999',
  STANDARD_16: '9999 9999 9999 9999',
  DEFAULT: '9999 9999 9999 9999'
};

/**
 * Detects card type and returns appropriate mask based on card number prefix.
 * @param {string} cardNumber - The card number (can include spaces).
 * @returns {string} The mask string for the detected card type.
 */
const getCardNumberMask = cardNumber => {
  if (!cardNumber) {
    return CARD_MASKS.DEFAULT;
  }

  const cleanNumber = cardNumber.replace(/\D/g, '');

  if (cleanNumber.length === 0) {
    return CARD_MASKS.DEFAULT;
  }

  if (/^3[47]/.test(cleanNumber)) {
    return CARD_MASKS.AMEX;
  }

  if (/^36/.test(cleanNumber)) {
    return CARD_MASKS.DINERS_14;
  }

  if (/^3(?:0[0-5]|095|8|9)/.test(cleanNumber)) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^35(?:2[89]|[3-8]\d)/.test(cleanNumber)) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^35/.test(cleanNumber) && cleanNumber.length < 4) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^62/.test(cleanNumber)) {
    if (/^6205[56]/.test(cleanNumber)) {
      return CARD_MASKS.UNIONPAY_19;
    }

    return CARD_MASKS.UNIONPAY_16;
  }

  if (/^4/.test(cleanNumber)) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^5[1-5]/.test(cleanNumber)) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^2(?:2[2-9]|[3-6]\d|7[01]|720)/.test(cleanNumber)) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^2[2-7]/.test(cleanNumber) && cleanNumber.length < 4) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^6011/.test(cleanNumber)) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^64[4-9]/.test(cleanNumber)) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^65/.test(cleanNumber)) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^5062/.test(cleanNumber)) {
    return CARD_MASKS.STANDARD_16;
  }

  if (/^6555/.test(cleanNumber)) {
    return CARD_MASKS.STANDARD_16;
  }

  return CARD_MASKS.DEFAULT;
};

export { getCardNumberMask, CARD_MASKS };
export default getCardNumberMask;
