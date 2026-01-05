// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { detectCardIssuer, CARD_ISSUER } from '../PaymentCardNumberInput/getCardNumberMask';

const SECURITY_CODE_MASKS = {
  AMEX: {
    mask: '9999',
    placeholder: '1234'
  },
  STANDARD: {
    mask: '999',
    placeholder: '123'
  }
};

/**
 * Returns maximum security code length for a given issuer.
 * Matches iOS PaymentCardUtilityInteractor.maxSecurityCodeLength.
 * @param {string|null} issuer - The card issuer identifier.
 * @returns {number} Maximum security code length.
 */
const maxSecurityCodeLength = issuer => {
  switch (issuer) {
    case CARD_ISSUER.AMERICAN_EXPRESS:
      return 4;
    case CARD_ISSUER.VISA:
    case CARD_ISSUER.MASTERCARD:
    case CARD_ISSUER.DISCOVER:
    case CARD_ISSUER.DINERS_CLUB:
    case CARD_ISSUER.JCB:
    case CARD_ISSUER.UNION_PAY:
      return 3;
    default:
      return 4;
  }
};

/**
 * Returns the appropriate security code mask based on card type.
 * Matches iOS PaymentCardUtilityInteractor.maxSecurityCodeLength.
 * If current value has more digits than the new mask allows, keeps the longer mask.
 * @param {string} cardNumber - The card number to detect card type from.
 * @param {string} currentValue - The current security code value (optional).
 * @returns {Object} Object with mask and placeholder properties.
 */
const getSecurityCodeMask = (cardNumber, currentValue) => {
  const issuer = detectCardIssuer(cardNumber);
  const maxLength = maxSecurityCodeLength(issuer);

  if (currentValue) {
    const currentDigits = currentValue.replace(/\D/g, '');

    if (currentDigits.length > maxLength) {
      return { ...SECURITY_CODE_MASKS.AMEX };
    }
  }

  if (maxLength === 4) {
    return { ...SECURITY_CODE_MASKS.AMEX };
  }

  return { ...SECURITY_CODE_MASKS.STANDARD };
};

export { getSecurityCodeMask, maxSecurityCodeLength, SECURITY_CODE_MASKS };
export default getSecurityCodeMask;
