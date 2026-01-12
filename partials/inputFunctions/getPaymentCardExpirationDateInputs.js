// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import {
  paymentCardExpirationDateSelectors,
  paymentCardDeniedKeywords,
  paymentCardExpirationMonthPlaceholders,
  paymentCardExpirationYearPlaceholders
} from '@/constants';
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
* Gets the data-field value from closest parent element that has it.
* @param {HTMLElement} element - The element to check.
* @return {string} The data-field value or empty string.
*/
const getParentDataField = element => {
  const parent = element.closest('[data-field]');

  if (parent) {
    return (parent.getAttribute('data-field') || '').toLowerCase();
  }

  return '';
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
  const placeholder = (element.getAttribute('placeholder') || '').toLowerCase();
  const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
  const dataField = getParentDataField(element);
  const className = (element.className || '').toLowerCase();

  if (autocomplete.includes('cc-exp-month')) {
    return 'month';
  }

  if (autocomplete.includes('cc-exp-year')) {
    return 'year';
  }

  if (autocomplete.includes('cc-exp')) {
    return 'combined';
  }

  const combined = name + id + placeholder + ariaLabel + dataField + className;

  const hasMonth = paymentCardExpirationMonthPlaceholders.some(keyword => combined.includes(keyword));
  const hasYear = paymentCardExpirationYearPlaceholders.some(keyword => combined.includes(keyword));

  if (hasMonth && hasYear) {
    return 'combined';
  }

  if (hasMonth) {
    return 'month';
  }

  if (hasYear) {
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

  const allElements = [...regularElements, ...shadowElements];
  const afterVisible = allElements.filter(element => isVisible(element));
  const afterUnique = afterVisible.filter(uniqueElementOnly);
  const afterConflicting = afterUnique.filter(filterConflictingAutocomplete);
  const filteredElements = afterConflicting.filter(filterDeniedKeywords);

  const result = filteredElements.map(element => {
    const tagName = element.tagName.toLowerCase();

    return {
      element,
      type: getExpirationDateType(element),
      isSelect: tagName === 'select'
    };
  });

  return result;
};

export default getPaymentCardExpirationDateInputs;
