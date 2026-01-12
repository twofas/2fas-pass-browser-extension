// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * JCB credit card name variations for form detection
 * @type {Readonly<string[]>}
 */
const PaymentCardIssuerJCB = Object.freeze([
  'JCB',
  'jcb',
  'Japan Credit Bureau',
  'JAPAN CREDIT BUREAU',
  'JCB Card',
  'JCB Credit',
  'JCB Credit Card',
  'JCB Debit',
  'JCB Debit Card',
  'JCB International',
  'JCB Gold',
  'JCB Platinum',
  'JCB The Class'
]);

export default PaymentCardIssuerJCB;
