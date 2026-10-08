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
import { createLabelMatcher, getElementLabelTexts, getPaymentCardElementsByLabel, getCardFieldScope } from './paymentCardLabels';

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
* Determines the type of expiration date input based on autocomplete, name/id, text hints, then (for a
* select) its options, then the visible label.
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

  const optionsType = element.tagName.toLowerCase() === 'select' ? getExpirationDateTypeFromOptions(element) : null;

  if (optionsType) {
    return optionsType;
  }

  return getExpirationDateTypeFromLabel(element) || 'combined';
};

/**
* Checks whether a selector-found expiration field already fills the part of a label-found one: the same
* part (month/year), or either of them is the combined date.
* @param {string} selectorType - The type of the selector-found field.
* @param {string} labelType - The type of the label-found field.
* @return {boolean} True if the label-found field is redundant.
*/
const coversExpirationType = (selectorType, labelType) => selectorType === labelType || selectorType === 'combined' || labelType === 'combined';

/**
* Gets the payment card expiration date input/select elements from the document, including those inside shadow DOMs.
* Fields are found by their identifiers (selectors) and, inside a payment context where the selectors did not
* find the same part, by the words of their label.
* @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @param {Object|null} [labelPass] - Label classification cache shared by the getters of one detection pass (createPaymentCardLabelPass()).
* @return {Array<{element: HTMLElement, type: string}>} The array of expiration date elements with their type.
*/
const getPaymentCardExpirationDateInputs = (shadowRoots = null, labelPass = null) => {
  const expirationDateSelector = paymentCardExpirationDateSelectors().join(', ');
  const resolvedShadowRoots = Array.isArray(shadowRoots) ? shadowRoots : getShadowRoots();
  const filterExpirationElements = elements => elements
    .filter(filterConflictingAutocomplete)
    .filter(filterDeniedKeywords);
  const toResult = element => ({
    element,
    type: getExpirationDateType(element),
    isSelect: element.tagName.toLowerCase() === 'select'
  });
  const selectorResults = filterExpirationElements(collectInputs(expirationDateSelector, resolvedShadowRoots)).map(toResult);
  const selectorElements = selectorResults.map(result => result.element);
  const labelResults = filterExpirationElements(getPaymentCardElementsByLabel('expiration', resolvedShadowRoots, labelPass))
    .filter((element, index, elements) => !selectorElements.includes(element) && uniqueElementOnly(element, index, elements))
    .map(toResult)
    .filter(labelResult => {
      const scope = getCardFieldScope(labelResult.element);

      return !selectorResults.some(selectorResult => coversExpirationType(selectorResult.type, labelResult.type) && scope.contains(selectorResult.element));
    });

  return [...selectorResults, ...labelResults];
};

export default getPaymentCardExpirationDateInputs;
