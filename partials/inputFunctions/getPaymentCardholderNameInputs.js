// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardholderNameSelectors, paymentCardDeniedKeywords } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

/**
* Filters out inputs that contain denied keywords in their name or id.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input should be kept, false otherwise.
*/
const filterDeniedKeywords = input => {
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const hasDeniedWord = paymentCardDeniedKeywords.some(word => name.includes(word) || id.includes(word));

  return !hasDeniedWord;
};

/**
* Gets the payment cardholder name input elements from the document, including those inside shadow DOMs.
* @return {HTMLInputElement[]} The array of payment cardholder name input elements.
*/
const getPaymentCardholderNameInputs = () => {
  const cardholderNameSelector = paymentCardholderNameSelectors().join(', ');

  const regularInputs = Array.from(document.querySelectorAll(cardholderNameSelector));

  const shadowRoots = getShadowRoots();
  const shadowInputs = shadowRoots.flatMap(
    root => Array.from(root.querySelectorAll(cardholderNameSelector))
  );

  return [...regularInputs, ...shadowInputs]
    .filter(input => isVisible(input))
    .filter(uniqueElementOnly)
    .filter(filterDeniedKeywords);
};

export default getPaymentCardholderNameInputs;
