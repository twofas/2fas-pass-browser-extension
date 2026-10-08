// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Whole-word keywords in the class or id of an ancestor that mark a section which is not the payment
* card form (gift card, voucher, loyalty or search widgets whose fields reuse the "Card number" label).
* Applied to payment card fields found by their label.
*/
const paymentCardParentContextDeniedKeywords = /* @__PURE__ */ Object.freeze([
  'gift',
  'giftcard',
  'voucher',
  'coupon',
  'promo',
  'loyalty',
  'reward',
  'rewards',
  'membership',
  'search',
  'newsletter'
]);

export default paymentCardParentContextDeniedKeywords;
