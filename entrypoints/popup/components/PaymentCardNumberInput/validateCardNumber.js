// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { detectCardIssuer, maxCardNumberLength } from './getCardNumberMask';
import PaymentCard from '@/models/itemModels/PaymentCard';

/**
 * Validates a card number for live validation (red text indicator).
 * Returns true if card number is invalid, false if valid or empty.
 * @param {string} cardNumber - The card number to validate.
 * @return {boolean} True if invalid, false if valid or empty.
 */
const isCardNumberInvalid = cardNumber => {
  if (!cardNumber) {
    return false;
  }

  const digitsOnly = cardNumber.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return false;
  }

  const issuer = detectCardIssuer(cardNumber);
  const maxLength = maxCardNumberLength(issuer);

  if (issuer === null) {
    if (digitsOnly.length < 13 || digitsOnly.length > 19) {
      return true;
    }
  } else if (digitsOnly.length < maxLength) {
    return true;
  }

  return !PaymentCard.isValidLuhn(digitsOnly);
};

export default isCardNumberInvalid;
