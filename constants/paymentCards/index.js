// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export { default as paymentCardDeniedKeywords } from './paymentCardDeniedKeywords.js';
export { default as paymentCardLabelDeniedWords } from './paymentCardLabelDeniedWords.js';
export { default as paymentCardParentContextDeniedKeywords } from './paymentCardParentContextDeniedKeywords.js';

// Payment Card Number
export {
  paymentCardNumberWords,
  paymentCardNumberSelectors
} from './paymentCardNumber/index.js';

// Payment Cardholder Name
export {
  paymentCardholderNameWords,
  paymentCardholderNameSelectors
} from './paymentCardholderName/index.js';

// Payment Card Expiration Date
export {
  paymentCardExpirationDateWords,
  paymentCardExpirationDateSelectors,
  paymentCardExpirationMonthPlaceholders,
  paymentCardExpirationYearPlaceholders,
  paymentCardExpirationMonthWords,
  paymentCardExpirationYearWords
} from './paymentCardExpirationDate/index.js';

// Payment Card Security Code
export {
  paymentCardSecurityCodeWords,
  paymentCardSecurityCodeSelectors
} from './paymentCardSecurityCode/index.js';

// Payment Card Issuer (field detection)
export {
  paymentCardIssuerWords,
  paymentCardIssuerSelectors
} from './paymentCardIssuer/index.js';

// Payment Card Issuers (name variations)
export {
  PaymentCardIssuerVisa,
  PaymentCardIssuerMasterCard,
  PaymentCardIssuerAmericanExpress,
  PaymentCardIssuerDiscover,
  PaymentCardIssuerJCB,
  PaymentCardIssuerDinersClub,
  PaymentCardIssuerMaestro,
  PaymentCardIssuerUnionPay
} from './paymentCardIssuers/index.js';
