// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Validates an expiration date for live validation (red text indicator).
 * Returns true if expiration date is invalid, false if valid or empty.
 * @param {string} expirationDate - The expiration date to validate (MM/YY format).
 * @return {boolean} True if invalid, false if valid or empty.
 */
const isExpirationDateInvalid = expirationDate => {
  if (!expirationDate) {
    return false;
  }

  const cleanValue = expirationDate.replace(/\s/g, '');

  if (cleanValue.length === 0) {
    return false;
  }

  const parts = cleanValue.split('/');
  const monthPart = parts[0] || '';
  const digitsInMonth = monthPart.replace(/\D/g, '');

  if (digitsInMonth.length === 0) {
    return false;
  }

  const firstDigit = parseInt(digitsInMonth[0], 10);

  if (firstDigit > 1) {
    return true;
  }

  if (digitsInMonth.length >= 2) {
    const secondDigit = parseInt(digitsInMonth[1], 10);

    if (firstDigit === 0 && secondDigit === 0) {
      return true;
    }

    if (firstDigit === 1 && secondDigit > 2) {
      return true;
    }
  }

  return false;
};

export default isExpirationDateInvalid;
