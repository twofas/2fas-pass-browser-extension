// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * UnionPay credit card name variations for form detection
 * @type {Readonly<string[]>}
 */
const PaymentCardIssuerUnionPay = Object.freeze([
  'UnionPay',
  'UNIONPAY',
  'unionpay',
  'Union Pay',
  'UNION PAY',
  'CUP',
  'China UnionPay',
  'CHINA UNIONPAY',
  'China Union Pay',
  'UnionPay Card',
  'UnionPay Credit',
  'UnionPay Credit Card',
  'UnionPay Debit',
  'UnionPay Debit Card',
  'UnionPay International'
]);

export default PaymentCardIssuerUnionPay;
