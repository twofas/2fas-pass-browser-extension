// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardExpirationDateSelectors, paymentCardDeniedKeywords } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

const conflictingAutocompleteValues = [
  'cc-number',
  'cc-name',
  'cc-given-name',
  'cc-additional-name',
  'cc-family-name',
  'cc-csc',
  'cc-type'
];

/**
* Filters out inputs that have autocomplete attributes indicating non-expiration-date fields.
* @param {HTMLElement} input - The input or select element to check.
* @return {boolean} True if the element should be kept, false otherwise.
*/
const filterConflictingAutocomplete = input => {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase().trim();

  if (!autocomplete) {
    return true;
  }

  return !conflictingAutocompleteValues.includes(autocomplete);
};

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
* Determines the type of expiration date input based on autocomplete attribute.
* @param {HTMLElement} element - The input or select element.
* @return {string} The type: 'combined', 'month', or 'year'.
*/
const getExpirationDateType = element => {
  const autocomplete = (element.getAttribute('autocomplete') || '').toLowerCase();
  const name = (element.name || '').toLowerCase();
  const id = (element.id || '').toLowerCase();

  if (autocomplete === 'cc-exp-month' || name.includes('month') || id.includes('month')) {
    return 'month';
  }

  if (autocomplete === 'cc-exp-year' || name.includes('year') || id.includes('year')) {
    return 'year';
  }

  return 'combined';
};

/**
* Gets the payment card expiration date input/select elements from the document, including those inside shadow DOMs.
* @return {Array<{element: HTMLElement, type: string}>} The array of expiration date elements with their type.
*/
const getPaymentCardExpirationDateInputs = () => {
  const expirationDateSelector = paymentCardExpirationDateSelectors().join(', ');

  const regularElements = Array.from(document.querySelectorAll(expirationDateSelector));

  const shadowRoots = getShadowRoots();
  const shadowElements = shadowRoots.flatMap(
    root => Array.from(root.querySelectorAll(expirationDateSelector))
  );

  const allElements = [...regularElements, ...shadowElements]
    .filter(element => isVisible(element))
    .filter(uniqueElementOnly)
    .filter(filterConflictingAutocomplete)
    .filter(filterDeniedKeywords);

  return allElements.map(element => ({
    element,
    type: getExpirationDateType(element),
    isSelect: element.tagName.toLowerCase() === 'select'
  }));
};

export default getPaymentCardExpirationDateInputs;
