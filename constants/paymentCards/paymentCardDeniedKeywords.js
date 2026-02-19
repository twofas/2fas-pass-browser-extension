// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const paymentCardDeniedKeywords = Object.freeze([
  'password',
  'pass',
  'pwd',
  'search',
  'filter',
  'loyalty',
  'reward',
  'postal',
  'postcode',
  'zip',
  'zipcode',
  'address',
  'street',
  'city',
  'state',
  'province',
  'region',
  'country',
  'phone',
  'tel',
  'mobile',
  'fax',
  'email'
]);

export default paymentCardDeniedKeywords;
