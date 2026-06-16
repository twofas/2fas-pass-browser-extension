// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardDeniedKeywords } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

// Keywords up to this length are collision-prone as raw substrings (e.g. 'pass'
// inside 'passenger', 'tel' inside 'hotel'), so they require a token boundary.
// Longer keywords are matched as substrings: accidental collisions are negligible
// and this still catches glued identifiers like 'userfirstname' or 'securitycode'.
const SHORT_KEYWORD_MAX_LENGTH = 6;

/**
* Checks whether a string contains any character outside the basic ASCII range.
* @param {string} value - The string to test.
* @return {boolean} True if a non-ASCII character is present.
*/
const hasNonAsciiChar = value => {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 127) {
      return true;
    }
  }

  return false;
};

/**
* Splits an identifier into a space-delimited, lowercased token string. Breaks on
* camelCase boundaries, letter/digit transitions (so 'cvv2' -> 'cvv 2') and any run
* of non-alphanumeric characters, enabling whole-word matching of short keywords.
* @param {string} value - The raw identifier (name, id, …).
* @return {string} The tokenized, lowercased string.
*/
const tokenizeIdentifier = value => String(value || '')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
  .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

/**
* Checks whether any keyword occurs in the value. Short ASCII keywords must match on
* token boundaries (avoiding substring false positives such as 'pass' in 'passenger');
* long or non-ASCII keywords are matched as substrings.
* @param {string} value - The raw identifier to inspect.
* @param {string[]} keywords - Keywords to match.
* @return {boolean} True if a keyword matches.
*/
const containsDeniedWord = (value, keywords) => {
  const rawLower = String(value || '').toLowerCase();

  if (!rawLower) {
    return false;
  }

  const bounded = ` ${tokenizeIdentifier(value)} `;

  return keywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();

    if (lowerKeyword.length > SHORT_KEYWORD_MAX_LENGTH || hasNonAsciiChar(lowerKeyword)) {
      return rawLower.includes(lowerKeyword);
    }

    const tokenizedKeyword = tokenizeIdentifier(keyword);

    return tokenizedKeyword.length > 0 && bounded.includes(` ${tokenizedKeyword} `);
  });
};

/**
* Filters out inputs that contain denied keywords (as whole words) in their name or id.
* @param {HTMLElement} input - The input or select element to check.
* @return {boolean} True if the element should be kept, false otherwise.
*/
const filterDeniedKeywords = input => {
  const hasDeniedWord = containsDeniedWord(input.name || '', paymentCardDeniedKeywords) ||
    containsDeniedWord(input.id || '', paymentCardDeniedKeywords);

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

  // Per the WHATWG autofill grammar, optional section-*/shipping/billing/contact
  // tokens may precede the field-name token (e.g. 'billing cc-name'). Match on the
  // trailing field token so grouped variants are still rejected.
  const tokens = autocomplete.split(/\s+/);
  const fieldToken = tokens[tokens.length - 1];

  return !conflictingAutocompleteValues.includes(fieldToken);
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

export { containsDeniedWord, filterDeniedKeywords, makeConflictingAutocompleteFilter, getParentDataField, collectInputs };
