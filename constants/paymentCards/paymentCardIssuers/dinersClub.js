// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Diners Club credit card name variations for form detection
 * @type {Readonly<string[]>}
 */
const PaymentCardIssuerDinersClub = Object.freeze([
  'Diners Club',
  'DINERS CLUB',
  'Diners',
  'DINERS',
  'diners',
  'DC',
  'Diners Club International',
  'DINERS CLUB INTERNATIONAL',
  'Diners Club Card',
  'Diners Card',
  'Diners Club Credit',
  'Diners Club Credit Card',
  'Carte Blanche',
  'CARTE BLANCHE',
  'Diners Club Carte Blanche'
]);

export default PaymentCardIssuerDinersClub;
