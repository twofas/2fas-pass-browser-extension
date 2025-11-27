// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

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
 * Returns the appropriate security code mask based on card type.
 * @param {string} cardNumber - The card number to detect card type from.
 * @returns {Object} Object with mask and placeholder properties.
 */
const getSecurityCodeMask = cardNumber => {
  if (!cardNumber) {
    return { ...SECURITY_CODE_MASKS.STANDARD };
  }

  const cleanNumber = cardNumber.replace(/\D/g, '');

  if (cleanNumber.length === 0) {
    return { ...SECURITY_CODE_MASKS.STANDARD };
  }

  if (/^3[47]/.test(cleanNumber)) {
    return { ...SECURITY_CODE_MASKS.AMEX };
  }

  return { ...SECURITY_CODE_MASKS.STANDARD };
};

export { getSecurityCodeMask, SECURITY_CODE_MASKS };
export default getSecurityCodeMask;
