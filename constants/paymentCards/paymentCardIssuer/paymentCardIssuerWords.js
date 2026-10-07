// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Lowercase phrases that name the payment card ISSUER (type/brand) select in its visible label,
* aria-label, aria-labelledby text or title. Matched by partials/inputFunctions/paymentCardLabels.js:
* longer phrases must start a word (an inflected ending is allowed), CJK/Hangul phrases match anywhere.
* A bare "type" is never listed. Languages are limited to the ones covered by Chromium's credit card
* autofill patterns.
*/
const paymentCardIssuerWords = /* @__PURE__ */ Object.freeze([
  'card type', // English
  'card brand', // English
  'type of card', // English
  'kartentyp', // German
  'kartenart', // German
  'tipo de tarjeta', // Spanish
  'type de carte', // French
  'tipo di carta', // Italian
  'tipo carta', // Italian
  'tipo de cartão', // Portuguese
  'tipo de cartao', // Portuguese
  'bandeira do cartão', // Portuguese
  'тип карты', // Russian
  'カードの種類', // Japanese
  'カード種類', // Japanese
  'カードブランド', // Japanese
  '卡类型', // Chinese (Simplified)
  '卡類型', // Chinese (Traditional)
  '卡别', // Chinese (Simplified)
  '卡別', // Chinese (Traditional)
  '카드 종류', // Korean
  '카드종류', // Korean
  'jenis kartu' // Indonesian
]);

export default paymentCardIssuerWords;
