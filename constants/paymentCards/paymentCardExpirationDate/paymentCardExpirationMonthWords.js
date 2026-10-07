// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Lowercase words that mark an expiration date field found by its label as the MONTH part. Checked only
* against the visible label of a field already recognised as an expiration date field. Languages: every language
* of the extension's i18n (English, Polish, German — enforced by paymentCardWords.test.js) plus the ones covered
* by Chromium's credit card autofill patterns.
*/
const paymentCardExpirationMonthWords = /* @__PURE__ */ Object.freeze([
  'month',
  'mm',
  'monat',
  'miesiąc',
  'mes',
  'mois',
  'mese',
  'mês',
  'месяц',
  '月',
  '월',
  'bulan'
]);

export default paymentCardExpirationMonthWords;
