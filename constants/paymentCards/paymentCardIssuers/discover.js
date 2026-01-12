// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Discover credit card name variations for form detection
 * @type {Readonly<string[]>}
 */
const PaymentCardIssuerDiscover = Object.freeze([
  'Discover',
  'DISCOVER',
  'discover',
  'DISC',
  'Disc',
  'disc',
  'DIS',
  'Dis',
  'dis',
  'Discover Card',
  'DISCOVER Card',
  'Discover Credit',
  'Discover Credit Card',
  'DISCOVER Credit Card',
  'Discover Debit',
  'Discover Debit Card',
  'Discover Network',
  'Discover it',
  'Discover It',
  'Discover it Card',
  'Discover It Card',
  'Discover Cashback',
  'Discover Cash Back'
]);

export default PaymentCardIssuerDiscover;
