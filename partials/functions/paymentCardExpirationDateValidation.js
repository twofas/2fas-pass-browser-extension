// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Check if a payment card is expired based on MM/YY or MM/YYYY format.
 * @param {string} value - The expiration date in MM/YY or MM/YYYY format.
 * @return {boolean} Returns true if the card is expired, false otherwise or if format is invalid.
 */
const isCardExpired = value => {
  if (typeof value !== 'string') {
    return false;
  }

  const regex = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/;
  const match = value.match(regex);

  if (!match) {
    return false;
  }

  const month = parseInt(match[1], 10);
  const yearValue = parseInt(match[2], 10);
  const year = match[2].length === 2 ? yearValue + 2000 : yearValue;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) {
    return true;
  }

  if (year === currentYear && month < currentMonth) {
    return true;
  }

  return false;
};

export default isCardExpired;
