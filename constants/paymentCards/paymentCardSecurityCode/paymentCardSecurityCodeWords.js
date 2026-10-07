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
* PIN" (a different secret). Languages are limited to the ones covered by Chromium's credit card autofill
* patterns.
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
  'cid', // Card Identification Number (American Express)
  'security code', // English
  'card code', // English
  'card security', // English
  'card verification', // English
  'card identification', // English
  'sicherheitscode', // German
  'kartenprüfn', // German
  'prüfnummer', // German
  'prüfziffer', // German
  'código de seguridad', // Spanish
  'codigo de seguridad', // Spanish
  'code de sécurité', // French
  'code de securite', // French
  'cryptogramme', // French
  'codice di sicurezza', // Italian
  'código de segurança', // Portuguese
  'codigo de seguranca', // Portuguese
  'защитный код', // Russian
  'セキュリティコード', // Japanese
  '安全码', // Chinese (Simplified)
  '安全碼', // Chinese (Traditional)
  '보안 코드', // Korean
  '보안코드' // Korean
]);

export default paymentCardSecurityCodeWords;
