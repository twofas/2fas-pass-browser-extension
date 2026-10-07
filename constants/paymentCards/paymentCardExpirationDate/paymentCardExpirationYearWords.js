// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Lowercase words that mark an expiration date field found by its label as the YEAR part. Checked only
* against the visible label of a field already recognised as an expiration date field. Languages are
* limited to the ones covered by Chromium's credit card autofill patterns.
*/
const paymentCardExpirationYearWords = /* @__PURE__ */ Object.freeze([
  'year', // English
  'yy', // Format
  'yyyy', // Format
  'jahr', // German
  'jj', // German format
  'jjjj', // German format
  'año', // Spanish
  'aa', // Spanish, French, Portuguese format
  'aaaa', // Spanish, French, Portuguese format
  'année', // French
  'anno', // Italian
  'ano', // Portuguese
  'год', // Russian
  'гг', // Russian format
  '年', // Japanese, Chinese
  '연도', // Korean
  'tahun' // Indonesian
]);

export default paymentCardExpirationYearWords;
