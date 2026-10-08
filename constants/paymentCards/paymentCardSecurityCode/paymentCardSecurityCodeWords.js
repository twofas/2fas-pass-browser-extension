// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Lowercase phrases that name a payment card SECURITY CODE (CVV/CVC) field in its visible label,
* aria-label, aria-labelledby text, placeholder or title. Matched by
* partials/inputFunctions/paymentCardLabels.js: words of up to 6 characters must stand alone, longer ones
* must start a word (an inflected ending is allowed), CJK/Hangul phrases match anywhere. A bare
* "verification" or "verification code" is never listed (it names SMS and e-mail code fields), nor "card
* PIN" (a different secret), nor "CID" (also a customer ID; it is matched in identifiers only). Languages: every language of the extension's i18n (English, Polish, German —
* enforced by paymentCardWords.test.js) plus the ones covered by Chromium's credit card autofill patterns.
*/
const paymentCardSecurityCodeWords = /* @__PURE__ */ Object.freeze([
  'cvv', // Card Verification Value
  'cvv2', // Card Verification Value 2
  'cvc', // Card Verification Code
  'cvc2', // Card Verification Code 2
  'csc', // Card Security Code
  'cvn', // Card Verification Number
  'cvd', // Card Verification Data
  'ccv', // Card Code Verification
  'security code',
  'card code',
  'card security',
  'card verification',
  'card identification',
  'sicherheitscode',
  'kartenprüfn',
  'prüfnummer',
  'prüfziffer',
  'sicherheitsnummer',
  'kod bezpieczeństwa',
  'kod bezp.',
  'kod zabezpieczający',
  'código de seguridad',
  'codigo de seguridad',
  'code de sécurité',
  'code de securite',
  'cryptogramme',
  'codice di sicurezza',
  'código de segurança',
  'codigo de seguranca',
  'защитный код',
  'セキュリティコード',
  '安全码',
  '安全碼',
  '보안 코드',
  '보안코드'
]);

export default paymentCardSecurityCodeWords;
