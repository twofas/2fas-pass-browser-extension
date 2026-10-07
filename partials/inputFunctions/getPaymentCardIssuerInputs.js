// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardIssuerSelectors } from '@/constants';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';
import { filterDeniedKeywords, makeConflictingAutocompleteFilter, collectInputs } from './shared';
import { getPaymentCardElementsByLabel, withoutSelectorCoveredScopes } from './paymentCardLabels';

const conflictingAutocompleteValues = [
  'cc-number',
  'cc-name',
  'cc-given-name',
  'cc-additional-name',
  'cc-family-name',
  'cc-exp',
  'cc-exp-month',
  'cc-exp-year',
  'cc-csc'
];

const filterConflictingAutocomplete = makeConflictingAutocompleteFilter(conflictingAutocompleteValues);

/**
 * Checks whether an element explicitly declares itself the card brand/type control.
 * The W3C autocomplete token is authoritative, so it overrides the denied-keyword heuristic.
 * @param {HTMLElement} element - The element to check.
 * @return {boolean} True if the element's autocomplete field token is 'cc-type'.
 */
const hasIssuerAutocomplete = element => {
  const autocomplete = (element.getAttribute('autocomplete') || '').toLowerCase().trim();

  return autocomplete.split(/\s+/).pop() === 'cc-type';
};

/**
 * Gets the payment card issuer input/select elements from the document, including those inside shadow DOMs.
 * Fields are found by their identifiers (selectors) and, inside a payment context where the selectors found
 * none, selects by the words of their label.
 * @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @param {Object|null} [labelPass] - Label classification cache shared by the getters of one detection pass (createPaymentCardLabelPass()).
 * @return {Array<{element: HTMLElement, isSelect: boolean}>} The array of issuer elements.
 */
const getPaymentCardIssuerInputs = (shadowRoots = null, labelPass = null) => {
  const issuerSelector = paymentCardIssuerSelectors().join(', ');
  const resolvedShadowRoots = Array.isArray(shadowRoots) ? shadowRoots : getShadowRoots();
  const filterIssuerElements = elements => elements
    .filter(filterConflictingAutocomplete)
    .filter(element => hasIssuerAutocomplete(element) || filterDeniedKeywords(element));
  const selectorElements = filterIssuerElements(collectInputs(issuerSelector, resolvedShadowRoots));
  const labelElements = filterIssuerElements(
    withoutSelectorCoveredScopes(getPaymentCardElementsByLabel('issuer', resolvedShadowRoots, labelPass), selectorElements)
  );
  const filteredElements = [...selectorElements, ...labelElements].filter(uniqueElementOnly);

  const result = filteredElements.map(element => ({
    element,
    isSelect: element.tagName.toLowerCase() === 'select'
  }));

  return result;
};

export default getPaymentCardIssuerInputs;
