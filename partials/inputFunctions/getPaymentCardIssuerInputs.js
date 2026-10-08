// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardIssuerSelectors, paymentCardIssuerGenericSelectors } from '@/constants';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';
import { filterDeniedKeywords, makeConflictingAutocompleteFilter, collectInputs } from './shared';
import { getPaymentCardElementsByLabel, withoutSelectorCoveredScopes, isInPaymentCardForm } from './paymentCardLabels';
import getPaymentCardIssuerRadioGroups from './getPaymentCardIssuerRadioGroups';

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
 * Checks whether the autofill can put a card brand into an element: a select (by choosing a matching option) or a text input.
 * Radios and checkboxes carry the page's own value, so writing the brand into it would corrupt the page's choice.
 * @param {HTMLElement} element - The element to check.
 * @return {boolean} True for a select or a text input.
 */
const isFillableIssuerControl = element => element.tagName.toLowerCase() === 'select' || element.type === 'text';

/**
 * Gets the payment card issuer controls from the document, including those inside shadow DOMs: selects and text
 * inputs found by their identifiers (selectors) and, inside a payment context where the selectors found none,
 * selects by the words of their label, plus groups of card brand radios. A control named only by a generic word
 * (issuer, brand, network, provider) counts only inside a payment card form.
 * @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
 * @param {Object|null} [labelPass] - Label classification cache shared by the getters of one detection pass (createPaymentCardLabelPass()).
 * @return {Array<{element: HTMLElement, isSelect: boolean, isRadioGroup?: boolean, radios?: HTMLInputElement[], issuerKeys?: string[]}>} The issuer controls.
 */
const getPaymentCardIssuerInputs = (shadowRoots = null, labelPass = null) => {
  const issuerSelector = paymentCardIssuerSelectors().join(', ');
  const genericIssuerSelector = paymentCardIssuerGenericSelectors().join(', ');
  const resolvedShadowRoots = Array.isArray(shadowRoots) ? shadowRoots : getShadowRoots();
  const filterIssuerElements = elements => elements
    .filter(isFillableIssuerControl)
    .filter(filterConflictingAutocomplete)
    .filter(element => hasIssuerAutocomplete(element) || filterDeniedKeywords(element));
  const selectorElements = filterIssuerElements([
    ...collectInputs(issuerSelector, resolvedShadowRoots),
    ...collectInputs(genericIssuerSelector, resolvedShadowRoots).filter(isInPaymentCardForm)
  ]);
  const labelElements = filterIssuerElements(
    withoutSelectorCoveredScopes(getPaymentCardElementsByLabel('issuer', resolvedShadowRoots, labelPass), selectorElements)
  );
  const filteredElements = [...selectorElements, ...labelElements].filter(uniqueElementOnly);

  const result = [
    ...filteredElements.map(element => ({
      element,
      isSelect: element.tagName.toLowerCase() === 'select'
    })),
    ...getPaymentCardIssuerRadioGroups(resolvedShadowRoots)
  ];

  return result;
};

export default getPaymentCardIssuerInputs;
