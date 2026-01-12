// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { detectCardIssuer } from '../PaymentCardNumberInput/getCardNumberMask';
import { maxSecurityCodeLength } from './getSecurityCodeMask';

/**
 * Validates a security code for live validation (red text indicator).
 * Returns true if security code is invalid, false if valid or empty.
 * @param {string} securityCode - The security code to validate.
 * @param {string} cardNumber - The card number to determine required length.
 * @return {boolean} True if invalid, false if valid or empty.
 */
const isSecurityCodeInvalid = (securityCode, cardNumber) => {
  if (!securityCode) {
    return false;
  }

  const digitsOnly = securityCode.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return false;
  }

  const issuer = detectCardIssuer(cardNumber);

  if (issuer === null) {
    return digitsOnly.length < 3;
  }

  const requiredLength = maxSecurityCodeLength(issuer);

  return digitsOnly.length < requiredLength;
};

export default isSecurityCodeInvalid;
