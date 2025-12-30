// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { detectCardIssuer } from '../PaymentCardNumberInput/getCardNumberMask';
import { maxSecurityCodeLength } from './getSecurityCodeMask';

/**
 * Checks if security code is too long for the detected card issuer.
 * Used to show warning when mask should be 3 but user has 4 digits.
 * @param {string} securityCode - The security code to check.
 * @param {string} cardNumber - The card number to determine required length.
 * @return {boolean} True if security code is too long, false otherwise.
 */
const isSecurityCodeTooLong = (securityCode, cardNumber) => {
  if (!securityCode) {
    return false;
  }

  const digitsOnly = securityCode.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return false;
  }

  const issuer = detectCardIssuer(cardNumber);

  if (issuer === null) {
    return false;
  }

  const requiredLength = maxSecurityCodeLength(issuer);

  return digitsOnly.length > requiredLength;
};

export default isSecurityCodeTooLong;
