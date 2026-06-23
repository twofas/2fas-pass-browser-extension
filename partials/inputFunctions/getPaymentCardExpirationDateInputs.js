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
import { containsDeniedWord, filterDeniedKeywords, makeConflictingAutocompleteFilter, getParentDataField, collectInputs } from './shared';

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
* Determines the type of expiration date input based on autocomplete, name/id, and text hints.
* @param {HTMLElement} element - The input or select element.
* @return {string} The type: 'combined', 'month', or 'year'.
*/
const getExpirationDateType = element => {
  const autocomplete = (element.getAttribute('autocomplete') || '').toLowerCase();
  const name = element.name || '';
  const id = element.id || '';
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

  // An explicit month/year token in the field's own name/id takes precedence over a
  // (possibly shared/templated) combined-looking placeholder such as "MM / YY".
  const nameIdValue = `${name} ${id} ${dataField}`;
  const nameIdMonth = containsDeniedWord(nameIdValue, paymentCardExpirationMonthPlaceholders);
  const nameIdYear = containsDeniedWord(nameIdValue, paymentCardExpirationYearPlaceholders);

  if (nameIdMonth && !nameIdYear) {
    return 'month';
  }

  if (nameIdYear && !nameIdMonth) {
    return 'year';
  }

  const combined = `${name} ${id} ${placeholder} ${ariaLabel} ${dataField} ${className}`;
  const hasMonth = containsDeniedWord(combined, paymentCardExpirationMonthPlaceholders);
  const hasYear = containsDeniedWord(combined, paymentCardExpirationYearPlaceholders);

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
* @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @return {Array<{element: HTMLElement, type: string}>} The array of expiration date elements with their type.
*/
const getPaymentCardExpirationDateInputs = (shadowRoots = null) => {
  const expirationDateSelector = paymentCardExpirationDateSelectors().join(', ');
  const visibleUniqueElements = collectInputs(expirationDateSelector, shadowRoots);
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
