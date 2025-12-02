// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export { default as paymentCardAttributes } from './paymentCardAttributes.js';
export { default as paymentCardDeniedKeywords } from './paymentCardDeniedKeywords.js';
export { default as paymentCardFormTexts } from './paymentCardFormTexts.js';

// Payment Card Number
export {
  paymentCardNumberTexts,
  paymentCardNumberWords,
  paymentCardNumberSelectors
} from './paymentCardNumber/index.js';

// Payment Cardholder Name
export {
  paymentCardholderNameTexts,
  paymentCardholderNameWords,
  paymentCardholderNameSelectors
} from './paymentCardholderName/index.js';

// Payment Card Expiration Date
export {
  paymentCardExpirationDateTexts,
  paymentCardExpirationDateWords,
  paymentCardExpirationDateSelectors
} from './paymentCardExpirationDate/index.js';

// Payment Card Security Code
export {
  paymentCardSecurityCodeTexts,
  paymentCardSecurityCodeWords,
  paymentCardSecurityCodeSelectors
} from './paymentCardSecurityCode/index.js';
