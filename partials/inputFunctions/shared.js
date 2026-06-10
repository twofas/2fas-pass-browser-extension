// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardDeniedKeywords } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

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
* Creates a filter that rejects inputs whose autocomplete attribute matches one of the given values.
* @param {string[]} conflictingAutocompleteValues - The autocomplete values to reject.
* @return {(input: HTMLElement) => boolean} A predicate returning true if the input should be kept.
*/
const makeConflictingAutocompleteFilter = conflictingAutocompleteValues => input => {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase().trim();

  if (!autocomplete) {
    return true;
  }

  return !conflictingAutocompleteValues.includes(autocomplete);
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
* Collects visible, unique elements matching a selector from the document and all shadow roots.
* @param {string} selector - The CSS selector to query.
* @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @return {HTMLElement[]} The array of matched, visible, unique elements.
*/
const collectInputs = (selector, shadowRoots = null) => {
  const regularElements = Array.from(document.querySelectorAll(selector));
  const resolvedShadowRoots = Array.isArray(shadowRoots) ? shadowRoots : getShadowRoots();

  const shadowElements = resolvedShadowRoots.flatMap(
    root => Array.from(root.querySelectorAll(selector))
  );

  const allElements = [...regularElements, ...shadowElements];
  const afterVisible = allElements.filter(element => isVisible(element));

  return afterVisible.filter(uniqueElementOnly);
};

export { filterDeniedKeywords, makeConflictingAutocompleteFilter, getParentDataField, collectInputs };
