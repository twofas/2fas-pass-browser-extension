// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import {
  paymentCardExpirationDateSelectors,
  paymentCardExpirationMonthPlaceholders,
  paymentCardExpirationYearPlaceholders
} from '@/constants';
import { filterDeniedKeywords, makeConflictingAutocompleteFilter, getParentDataField, collectInputs } from './shared';

const conflictingAutocompleteValues = [
  'cc-number',
  'cc-name',
  'cc-given-name',
  'cc-additional-name',
  'cc-family-name',
  'cc-csc',
  'cc-type'
];

const filterConflictingAutocomplete = makeConflictingAutocompleteFilter(conflictingAutocompleteValues);

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
  const visibleUniqueElements = collectInputs(expirationDateSelector);
  const afterConflicting = visibleUniqueElements.filter(filterConflictingAutocomplete);
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
