// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * MasterCard credit card name variations for form detection
 * @type {Readonly<string[]>}
 */
const PaymentCardIssuerMasterCard = Object.freeze([
  'MasterCard',
  'Mastercard',
  'Master Card',
  'MASTERCARD',
  'mastercard',
  'MC',
  'mc',
  'Master',
  'MasterCard Credit',
  'Mastercard Credit',
  'MasterCard Debit',
  'Mastercard Debit',
  'MasterCard Credit Card',
  'Mastercard Credit Card',
  'MasterCard Debit Card',
  'Mastercard Debit Card',
  'MasterCard Standard',
  'MasterCard Gold',
  'MasterCard Platinum',
  'MasterCard World',
  'MasterCard World Elite',
  'Mastercard Standard',
  'Mastercard Gold',
  'Mastercard Platinum',
  'Mastercard World',
  'Mastercard World Elite'
]);

export default PaymentCardIssuerMasterCard;
