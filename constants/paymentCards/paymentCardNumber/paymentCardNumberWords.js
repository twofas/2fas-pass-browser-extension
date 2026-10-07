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
* "number" or "card". Languages: every language of the extension's i18n (English, Polish, German — enforced by
* paymentCardWords.test.js) plus the ones covered by Chromium's credit card autofill patterns.
*/
const paymentCardNumberWords = /* @__PURE__ */ Object.freeze([
  'card number',
  'card num',
  'card no.',
  'card #',
  'cc number',
  'cc #',
  'kartennummer',
  'kreditkartennummer',
  'karten-nr',
  'kartennr',
  'numer karty',
  'nr karty',
  'número de tarjeta',
  'numero de tarjeta',
  'número de la tarjeta',
  'numero de la tarjeta',
  'numéro de carte',
  'numero de carte',
  'numéro de la carte',
  'numero de la carte',
  'n° de carte',
  'numero carta',
  'numero della carta',
  'numero di carta',
  'número do cartão',
  'numero do cartao',
  'número de cartão',
  'numero de cartao',
  'номер карты',
  'номер банковской карты',
  'номер кредитной карты',
  'カード番号',
  '卡号',
  '卡號',
  '카드 번호',
  '카드번호',
  'nomor kartu',
  'no. kartu',
  'no kartu'
]);

export default paymentCardNumberWords;
