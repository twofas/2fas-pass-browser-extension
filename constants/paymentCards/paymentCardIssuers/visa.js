// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Visa credit card name variations for form detection
 * @type {Readonly<string[]>}
 */
const PaymentCardIssuerVisa = Object.freeze([
  'Visa',
  'VISA',
  'visa',
  'Visa Card',
  'VISA Card',
  'Visa Credit',
  'VISA Credit',
  'Visa Debit',
  'VISA Debit',
  'Visa Credit Card',
  'VISA Credit Card',
  'Visa Debit Card',
  'VISA Debit Card',
  'Visa Electron',
  'VISA Electron',
  'Visa Classic',
  'Visa Gold',
  'Visa Platinum',
  'Visa Signature',
  'Visa Infinite'
]);

export default PaymentCardIssuerVisa;
