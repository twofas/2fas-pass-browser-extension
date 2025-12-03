// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * American Express credit card name variations for form detection
 * @type {Readonly<string[]>}
 */
const PaymentCardIssuerAmericanExpress = Object.freeze([
  'American Express',
  'AMERICAN EXPRESS',
  'american express',
  'AMEX',
  'Amex',
  'AmEx',
  'amex',
  'American Express Card',
  'AMEX Card',
  'Amex Card',
  'American Express Credit',
  'American Express Credit Card',
  'AMEX Credit Card',
  'Amex Credit Card',
  'American Express Charge Card',
  'American Express Green',
  'American Express Gold',
  'American Express Platinum',
  'American Express Centurion',
  'American Express Blue',
  'American Express Blue Cash',
  'AMEX Green',
  'AMEX Gold',
  'AMEX Platinum',
  'AMEX Centurion',
  'AMEX Blue'
]);

export default PaymentCardIssuerAmericanExpress;
