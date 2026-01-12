// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardSecurityCodeSelectors, paymentCardDeniedKeywords } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

const conflictingAutocompleteValues = [
  'cc-number',
  'cc-name',
  'cc-given-name',
  'cc-additional-name',
  'cc-family-name',
  'cc-exp',
  'cc-exp-month',
  'cc-exp-year',
  'cc-type'
];

/**
* Filters out inputs that have autocomplete attributes indicating non-security-code fields.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input should be kept, false otherwise.
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
* Gets the payment card security code input elements from the document, including those inside shadow DOMs.
* @return {HTMLInputElement[]} The array of payment card security code input elements.
*/
const getPaymentCardSecurityCodeInputs = () => {
  const securityCodeSelector = paymentCardSecurityCodeSelectors().join(', ');
  const regularInputs = Array.from(document.querySelectorAll(securityCodeSelector));
  const shadowRoots = getShadowRoots();

  const shadowInputs = shadowRoots.flatMap(
    root => Array.from(root.querySelectorAll(securityCodeSelector))
  );

  const allInputs = [...regularInputs, ...shadowInputs];
  const afterVisible = allInputs.filter(input => isVisible(input));
  const afterUnique = afterVisible.filter(uniqueElementOnly);
  const afterConflicting = afterUnique.filter(filterConflictingAutocomplete);
  const result = afterConflicting.filter(filterDeniedKeywords);

  return result;
};

export default getPaymentCardSecurityCodeInputs;
