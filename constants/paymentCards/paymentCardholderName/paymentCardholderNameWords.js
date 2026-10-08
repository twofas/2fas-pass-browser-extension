// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Lowercase phrases that name the CARDHOLDER (name on card) field in its visible label, aria-label,
* placeholder or title. Used by partials/inputFunctions/getPaymentCardholderNameInputs.js. Only phrases
* scoped to the card are listed, never a bare "name". Languages: every language of the extension's i18n (English,
* Polish, German — enforced by paymentCardWords.test.js) plus the ones covered by Chromium's credit card autofill
* patterns; the Dutch phrases predate that rule and are kept.
*/
const paymentCardholderNameWords = /* @__PURE__ */ Object.freeze([
  'name on card',
  'name on the card',
  'full name on card',
  'cardholder name',
  'cardholder',
  'card holder',
  'card owner',
  'card name',
  'name auf der karte',
  'karteninhaber',
  'kartenbesitzer',
  'nombre en la tarjeta',
  'nombre en tarjeta',
  'nombre del titular',
  'titular de la tarjeta',
  'nom sur la carte',
  'nom du titulaire',
  'titulaire de la carte',
  'porteur de la carte',
  'nome sulla carta',
  'titolare della carta',
  'titolare carta',
  'intestatario della carta',
  'nome no cartão',
  'nome do titular',
  'nome impresso no cartão',
  'titular do cartão',
  'имя на карте',
  'имя владельца карты',
  'владелец карты',
  'держатель карты',
  'имя держателя карты',
  'カード名義',
  'カード所有者',
  'カード上の名前',
  '持卡人',
  '卡片姓名',
  '卡片上的姓名',
  '信用卡上的姓名',
  '开户名',
  '카드상의 이름',
  '카드 소유자',
  '카드소유자',
  'nama pada kartu',
  'nama di kartu',
  'nama pemegang kartu',
  'imię na karcie',
  'imie na karcie',
  'imię i nazwisko na karcie',
  'nazwa na karcie',
  'posiadacz karty',
  'posiadacza karty',
  'właściciel karty',
  'właściciela karty',
  'naam op kaart',
  'kaarthouder'
]);

export default paymentCardholderNameWords;
