// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import {
  paymentCardExpirationDateSelectors,
  paymentCardExpirationMonthPlaceholders,
  paymentCardExpirationYearPlaceholders,
  paymentCardExpirationMonthWords,
  paymentCardExpirationYearWords
} from '@/constants';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';
import { containsDeniedWord, filterDeniedKeywords, makeConflictingAutocompleteFilter, getParentDataField, collectInputs } from './shared';
import { createLabelMatcher, getElementLabelTexts, getPaymentCardElementsByLabel } from './paymentCardLabels';

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

const matchesMonthLabelWord = createLabelMatcher(paymentCardExpirationMonthWords);
const matchesYearLabelWord = createLabelMatcher(paymentCardExpirationYearWords);

const MONTH_OPTION_REGEX = /^(0?[1-9]|1[0-2])$/;
const FOUR_DIGIT_YEAR_OPTION_REGEX = /^(19|20)\d{2}$/;
const TWO_DIGIT_OPTION_REGEX = /^\d{2}$/;
const MONTHS_IN_YEAR = 12;

/**
* Reads the month/year part from the field's visible label texts.
* @param {HTMLElement} element - The input or select element.
* @return {string|null} 'combined', 'month', 'year', or null when the label names neither part.
*/
const getExpirationDateTypeFromLabel = element => {
  const texts = getElementLabelTexts(element);
  const hasMonth = texts.some(matchesMonthLabelWord);
  const hasYear = texts.some(matchesYearLabelWord);

  if (hasMonth && hasYear) {
    return 'combined';
  }

  if (hasMonth) {
    return 'month';
  }

  if (hasYear) {
    return 'year';
  }

  return null;
};

/**
* Infers the month/year part of a select from its option values (01–12 for months, years otherwise).
* @param {HTMLSelectElement} select - The select element.
* @return {string|null} 'month', 'year', or null when the options do not tell.
*/
const getExpirationDateTypeFromOptions = select => {
  const values = Array.from(select.options || [])
    .map(option => (option.value || '').trim())
    .filter(Boolean);

  if (values.length === 0) {
    return null;
  }

  const monthCount = values.filter(value => MONTH_OPTION_REGEX.test(value)).length;
  const yearCount = values.filter(value => FOUR_DIGIT_YEAR_OPTION_REGEX.test(value) || (TWO_DIGIT_OPTION_REGEX.test(value) && !MONTH_OPTION_REGEX.test(value))).length;

  if (monthCount === MONTHS_IN_YEAR && values.length <= MONTHS_IN_YEAR + 1) {
    return 'month';
  }

  if (yearCount > monthCount && yearCount >= values.length / 2) {
    return 'year';
  }

  return null;
};

/**
* Determines the type of expiration date input based on autocomplete, name/id, text hints, the visible label
* and, for a select, its options.
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

  const labelType = getExpirationDateTypeFromLabel(element);

  if (labelType) {
    return labelType;
  }

  if (element.tagName.toLowerCase() === 'select') {
    return getExpirationDateTypeFromOptions(element) || 'combined';
  }

  return 'combined';
};

/**
* Gets the payment card expiration date input/select elements from the document, including those inside shadow DOMs.
* Fields are found by their identifiers (selectors) and, inside a payment context, by the words of their label.
* @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @return {Array<{element: HTMLElement, type: string}>} The array of expiration date elements with their type.
*/
const getPaymentCardExpirationDateInputs = (shadowRoots = null) => {
  const expirationDateSelector = paymentCardExpirationDateSelectors().join(', ');
  const resolvedShadowRoots = Array.isArray(shadowRoots) ? shadowRoots : getShadowRoots();
  const visibleUniqueElements = [
    ...collectInputs(expirationDateSelector, resolvedShadowRoots),
    ...getPaymentCardElementsByLabel('expiration', resolvedShadowRoots)
  ].filter(uniqueElementOnly);
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
