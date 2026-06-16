// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardIssuerSelectors } from '@/constants';
import { filterDeniedKeywords, makeConflictingAutocompleteFilter, collectInputs } from './shared';

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
 * @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
 * @return {Array<{element: HTMLElement, isSelect: boolean}>} The array of issuer elements.
 */
const getPaymentCardIssuerInputs = (shadowRoots = null) => {
  const issuerSelector = paymentCardIssuerSelectors().join(', ');
  const visibleUniqueElements = collectInputs(issuerSelector, shadowRoots);
  const afterConflicting = visibleUniqueElements.filter(filterConflictingAutocomplete);
  const filteredElements = afterConflicting.filter(element => hasIssuerAutocomplete(element) || filterDeniedKeywords(element));

  const result = filteredElements.map(element => ({
    element,
    isSelect: element.tagName.toLowerCase() === 'select'
  }));

  return result;
};

export default getPaymentCardIssuerInputs;
