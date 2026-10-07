// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Lowercase phrases that name a payment card NUMBER field in its visible label, aria-label,
* aria-labelledby text, placeholder or title. Matched by partials/inputFunctions/paymentCardLabels.js:
* words of up to 6 characters must stand alone, longer ones must start a word (an inflected ending is
* allowed), CJK/Hangul phrases match anywhere. Only phrases scoped to the card are listed, never a bare
* "number" or "card". Languages are limited to the ones covered by Chromium's credit card autofill patterns.
*/
const paymentCardNumberWords = /* @__PURE__ */ Object.freeze([
  'card number', // English
  'card num', // English
  'card no.', // English
  'card #', // English
  'cc number', // English
  'cc #', // English
  'kartennummer', // German
  'kreditkartennummer', // German
  'karten-nr', // German
  'kartennr', // German
  'número de tarjeta', // Spanish
  'numero de tarjeta', // Spanish
  'número de la tarjeta', // Spanish
  'numero de la tarjeta', // Spanish
  'numéro de carte', // French
  'numero de carte', // French
  'numéro de la carte', // French
  'numero de la carte', // French
  'n° de carte', // French
  'numero carta', // Italian
  'numero della carta', // Italian
  'numero di carta', // Italian
  'número do cartão', // Portuguese
  'numero do cartao', // Portuguese
  'número de cartão', // Portuguese
  'numero de cartao', // Portuguese
  'номер карты', // Russian
  'номер банковской карты', // Russian
  'номер кредитной карты', // Russian
  'カード番号', // Japanese
  '卡号', // Chinese (Simplified)
  '卡號', // Chinese (Traditional)
  '카드 번호', // Korean
  '카드번호', // Korean
  'nomor kartu', // Indonesian
  'no. kartu', // Indonesian
  'no kartu' // Indonesian
]);

export default paymentCardNumberWords;
