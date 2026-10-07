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
* "month" or "year" is never listed. Languages: every language of the extension's i18n (English, Polish, German —
* enforced by paymentCardWords.test.js) plus the ones covered by Chromium's credit card autofill patterns.
*/
const paymentCardExpirationDateWords = /* @__PURE__ */ Object.freeze([
  'expiry',
  'expiration',
  'expires',
  'expire',
  'exp date',
  'exp. date',
  'valid thru',
  'valid through',
  'valid until',
  'mm/yy',
  'mm / yy',
  'mm/yyyy',
  'mm / yyyy',
  'mm-yy',
  'ablaufdatum',
  'gültig bis',
  'gueltig bis',
  'gültigkeit',
  'verfallsdatum',
  'mm/jj',
  'mm/jjjj',
  'ważności',
  'ważna do',
  'data wygaśnięcia',
  'mm/rr',
  'mm/rrrr',
  'caducidad',
  'vencimiento',
  'fecha de expiración',
  'fecha de expiracion',
  'mm/aa',
  'mm/aaaa',
  'scadenza',
  'validade',
  'срок действия',
  'мм/гг',
  '有効期限',
  '有效期',
  '过期',
  '到期',
  '만료',
  '유효기간',
  '유효 기간',
  'masa berlaku',
  'berlaku hingga'
]);

export default paymentCardExpirationDateWords;
