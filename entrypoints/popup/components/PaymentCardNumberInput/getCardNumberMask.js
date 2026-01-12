// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Card issuer types matching iOS PaymentCardIssuer enum.
 */
const CARD_ISSUER = Object.freeze({
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMERICAN_EXPRESS: 'americanExpress',
  DISCOVER: 'discover',
  DINERS_CLUB: 'dinersClub',
  JCB: 'jcb',
  UNION_PAY: 'unionPay'
});

/**
 * Card type definitions with masks.
 * Formats:
 * - Visa, Mastercard, JCB (16 digits): 4-4-4-4
 * - American Express (15 digits): 4-6-5
 * - Discover, Diners Club, UnionPay (up to 19 digits): 4-4-4-4-3
 */
const CARD_MASKS = {
  AMEX: '9999 999999 99999',
  STANDARD_16: '9999 9999 9999 9999',
  STANDARD_19: '9999 9999 9999 9999 999',
  DEFAULT: '9999 9999 9999 9999 999'
};

/**
 * Detects card issuer based on card number prefix.
 * Detection order and logic matches iOS PaymentCardUtilityInteractor.detectCardIssuer.
 * @param {string} cardNumber - The card number (can include spaces).
 * @returns {string|null} The card issuer identifier or null if not detected.
 */
const detectCardIssuer = cardNumber => {
  if (!cardNumber) {
    return null;
  }

  const trimmed = cardNumber.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return null;
  }

  if (digitsOnly.startsWith('4')) {
    return CARD_ISSUER.VISA;
  }

  const first2 = parseInt(digitsOnly.substring(0, 2), 10);

  if (digitsOnly.length >= 2 && first2 >= 51 && first2 <= 55) {
    return CARD_ISSUER.MASTERCARD;
  }

  const first4 = parseInt(digitsOnly.substring(0, 4), 10);

  if (digitsOnly.length >= 4 && first4 >= 2221 && first4 <= 2720) {
    return CARD_ISSUER.MASTERCARD;
  }

  if (digitsOnly.startsWith('34') || digitsOnly.startsWith('37')) {
    return CARD_ISSUER.AMERICAN_EXPRESS;
  }

  if (digitsOnly.startsWith('6011') || digitsOnly.startsWith('65')) {
    return CARD_ISSUER.DISCOVER;
  }

  const first3 = parseInt(digitsOnly.substring(0, 3), 10);

  if (digitsOnly.length >= 3 && first3 >= 644 && first3 <= 649) {
    return CARD_ISSUER.DISCOVER;
  }

  const first6 = parseInt(digitsOnly.substring(0, 6), 10);

  if (digitsOnly.length >= 6 && first6 >= 622126 && first6 <= 622925) {
    return CARD_ISSUER.DISCOVER;
  }

  if (digitsOnly.startsWith('36') || digitsOnly.startsWith('38') || digitsOnly.startsWith('39')) {
    return CARD_ISSUER.DINERS_CLUB;
  }

  if (digitsOnly.length >= 3 && first3 >= 300 && first3 <= 305) {
    return CARD_ISSUER.DINERS_CLUB;
  }

  if (digitsOnly.length >= 4 && first4 >= 3528 && first4 <= 3589) {
    return CARD_ISSUER.JCB;
  }

  if (digitsOnly.startsWith('62')) {
    return CARD_ISSUER.UNION_PAY;
  }

  return null;
};

/**
 * Returns maximum card number length for a given issuer.
 * Matches iOS PaymentCardUtilityInteractor.maxCardNumberLength.
 * @param {string|null} issuer - The card issuer identifier.
 * @returns {number} Maximum card number length.
 */
const maxCardNumberLength = issuer => {
  switch (issuer) {
    case CARD_ISSUER.VISA:
    case CARD_ISSUER.MASTERCARD:
    case CARD_ISSUER.JCB:
      return 16;
    case CARD_ISSUER.AMERICAN_EXPRESS:
      return 15;
    case CARD_ISSUER.DISCOVER:
    case CARD_ISSUER.DINERS_CLUB:
    case CARD_ISSUER.UNION_PAY:
      return 19;
    default:
      return 19;
  }
};

/**
 * Detects card type and returns appropriate mask based on card number prefix.
 * @param {string} cardNumber - The card number (can include spaces).
 * @returns {string} The mask string for the detected card type.
 */
const getCardNumberMask = cardNumber => {
  const issuer = detectCardIssuer(cardNumber);
  const maxLength = maxCardNumberLength(issuer);

  if (issuer === CARD_ISSUER.AMERICAN_EXPRESS) {
    return CARD_MASKS.AMEX;
  }

  if (maxLength === 16) {
    return CARD_MASKS.STANDARD_16;
  }

  if (maxLength === 19) {
    return CARD_MASKS.STANDARD_19;
  }

  return CARD_MASKS.DEFAULT;
};

export { getCardNumberMask, detectCardIssuer, maxCardNumberLength, CARD_MASKS, CARD_ISSUER };
export default getCardNumberMask;
