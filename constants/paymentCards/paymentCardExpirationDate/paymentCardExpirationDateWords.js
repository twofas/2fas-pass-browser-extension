// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Lowercase phrases that name a payment card EXPIRATION DATE field (combined, month or year) in its
* visible label, aria-label, aria-labelledby text, placeholder or title. Matched by
* partials/inputFunctions/paymentCardLabels.js: words of up to 6 characters must stand alone, longer ones
* must start a word (an inflected ending is allowed), CJK/Hangul phrases match anywhere. A bare "date",
* "month" or "year" is never listed. Languages are limited to the ones covered by Chromium's credit card
* autofill patterns.
*/
const paymentCardExpirationDateWords = /* @__PURE__ */ Object.freeze([
  'expiry', // English
  'expiration', // English, French
  'expires', // English
  'expire', // English, French
  'exp date', // English
  'exp. date', // English
  'valid thru', // English
  'valid through', // English
  'valid until', // English
  'mm/yy', // Format
  'mm / yy', // Format
  'mm/yyyy', // Format
  'mm / yyyy', // Format
  'mm-yy', // Format
  'ablaufdatum', // German
  'gültig bis', // German
  'gueltig bis', // German
  'gültigkeit', // German
  'verfallsdatum', // German
  'mm/jj', // German format
  'mm/jjjj', // German format
  'caducidad', // Spanish
  'vencimiento', // Spanish, Portuguese
  'fecha de expiración', // Spanish
  'fecha de expiracion', // Spanish
  'mm/aa', // Spanish, French, Portuguese format
  'mm/aaaa', // Spanish, French, Portuguese format
  'scadenza', // Italian
  'validade', // Portuguese
  'срок действия', // Russian
  'мм/гг', // Russian format
  '有効期限', // Japanese
  '有效期', // Chinese (Simplified)
  '过期', // Chinese (Simplified)
  '到期', // Chinese (Traditional)
  '만료', // Korean
  '유효기간', // Korean
  '유효 기간', // Korean
  'masa berlaku', // Indonesian
  'berlaku hingga' // Indonesian
]);

export default paymentCardExpirationDateWords;
