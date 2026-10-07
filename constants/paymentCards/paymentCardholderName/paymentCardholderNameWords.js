// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Lowercase phrases that name the CARDHOLDER (name on card) field in its visible label, aria-label,
* placeholder or title. Used by partials/inputFunctions/getPaymentCardholderNameInputs.js. Only phrases
* scoped to the card are listed, never a bare "name". Languages are limited to the ones covered by
* Chromium's credit card autofill patterns; the Polish and Dutch phrases predate that rule and are kept.
*/
const paymentCardholderNameWords = /* @__PURE__ */ Object.freeze([
  'name on card', // English
  'name on the card', // English
  'full name on card', // English
  'cardholder name', // English
  'cardholder', // English
  'card holder', // English
  'card owner', // English
  'card name', // English
  'name auf der karte', // German
  'karteninhaber', // German
  'nombre en la tarjeta', // Spanish
  'nombre en tarjeta', // Spanish
  'nombre del titular', // Spanish
  'titular de la tarjeta', // Spanish
  'nom sur la carte', // French
  'nom du titulaire', // French
  'titulaire de la carte', // French
  'porteur de la carte', // French
  'nome sulla carta', // Italian
  'titolare della carta', // Italian
  'titolare carta', // Italian
  'intestatario della carta', // Italian
  'nome no cartão', // Portuguese
  'nome do titular', // Portuguese
  'nome impresso no cartão', // Portuguese
  'titular do cartão', // Portuguese
  'имя на карте', // Russian
  'имя владельца карты', // Russian
  'владелец карты', // Russian
  'держатель карты', // Russian
  'имя держателя карты', // Russian
  'カード名義', // Japanese
  'カード所有者', // Japanese
  'カード上の名前', // Japanese
  '持卡人', // Chinese
  '卡片姓名', // Chinese
  '卡片上的姓名', // Chinese (Simplified)
  '信用卡上的姓名', // Chinese (Traditional)
  '开户名', // Chinese (Simplified)
  '카드상의 이름', // Korean
  '카드 소유자', // Korean
  '카드소유자', // Korean
  'nama pada kartu', // Indonesian
  'nama di kartu', // Indonesian
  'nama pemegang kartu', // Indonesian
  'imię na karcie', // Polish
  'imię i nazwisko na karcie', // Polish
  'nazwa na karcie', // Polish
  'posiadacz karty', // Polish
  'naam op kaart', // Dutch
  'kaarthouder' // Dutch
]);

export default paymentCardholderNameWords;
