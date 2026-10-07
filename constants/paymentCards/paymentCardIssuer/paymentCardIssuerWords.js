// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Lowercase phrases that name the payment card ISSUER (type/brand) select in its visible label,
* aria-label, aria-labelledby text or title. Matched by partials/inputFunctions/paymentCardLabels.js:
* longer phrases must start a word (an inflected ending is allowed), CJK/Hangul phrases match anywhere.
* A bare "type" is never listed. Languages: every language of the extension's i18n (English, Polish, German —
* enforced by paymentCardWords.test.js) plus the ones covered by Chromium's credit card autofill patterns.
*/
const paymentCardIssuerWords = /* @__PURE__ */ Object.freeze([
  'card type',
  'card brand',
  'type of card',
  'kartentyp',
  'kartenart',
  'typ karty',
  'rodzaj karty',
  'tipo de tarjeta',
  'type de carte',
  'tipo di carta',
  'tipo carta',
  'tipo de cartão',
  'tipo de cartao',
  'bandeira do cartão',
  'тип карты',
  'カードの種類',
  'カード種類',
  'カードブランド',
  '卡类型',
  '卡類型',
  '卡别',
  '卡別',
  '카드 종류',
  '카드종류',
  'jenis kartu'
]);

export default paymentCardIssuerWords;
