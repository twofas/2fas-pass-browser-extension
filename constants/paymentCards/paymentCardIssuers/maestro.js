// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Maestro debit card name variations for form detection
 * @type {Readonly<string[]>}
 */
const PaymentCardIssuerMaestro = Object.freeze([
  'Maestro',
  'MAESTRO',
  'maestro',
  'Maestro Card',
  'MAESTRO Card',
  'Maestro Debit',
  'Maestro Debit Card',
  'MAESTRO Debit Card',
  'MasterCard Maestro',
  'Mastercard Maestro'
]);

export default PaymentCardIssuerMaestro;
