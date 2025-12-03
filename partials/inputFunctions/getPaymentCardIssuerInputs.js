// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardIssuerSelectors, paymentCardDeniedKeywords } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

/**
 * Filters out inputs that contain denied keywords in their name or id.
 * @param {HTMLElement} input - The input or select element to check.
 * @return {boolean} True if the element should be kept, false otherwise.
 */
const filterDeniedKeywords = input => {
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const hasDeniedWord = paymentCardDeniedKeywords.some(word => name.includes(word) || id.includes(word));

  return !hasDeniedWord;
};

/**
 * Gets the payment card issuer input/select elements from the document, including those inside shadow DOMs.
 * @return {Array<{element: HTMLElement, isSelect: boolean}>} The array of issuer elements.
 */
const getPaymentCardIssuerInputs = () => {
  const issuerSelector = paymentCardIssuerSelectors().join(', ');

  const regularElements = Array.from(document.querySelectorAll(issuerSelector));

  const shadowRoots = getShadowRoots();
  const shadowElements = shadowRoots.flatMap(
    root => Array.from(root.querySelectorAll(issuerSelector))
  );

  const allElements = [...regularElements, ...shadowElements]
    .filter(element => isVisible(element))
    .filter(uniqueElementOnly)
    .filter(filterDeniedKeywords);

  return allElements.map(element => ({
    element,
    isSelect: element.tagName.toLowerCase() === 'select'
  }));
};

export default getPaymentCardIssuerInputs;
