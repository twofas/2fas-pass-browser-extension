// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { parentContextDeniedKeywords } from '@/constants';

const MAX_PARENT_DEPTH = 8;

const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Creates a check that looks for whole-word keywords in the class names and IDs of an element's ancestors.
 * Uses word boundary matching to avoid false positives (e.g. "subscriber" != "subscribe"); camelCase words are
 * split as well (e.g. "giftCardForm" contains "gift").
 * @param {string[]} keywords - The denied keywords.
 * @param {number} [maxDepth=MAX_PARENT_DEPTH] - How many ancestors to inspect.
 * @return {(input: HTMLElement) => boolean} Returns true when an ancestor carries a denied keyword.
 */
export const createParentContextChecker = (keywords, maxDepth = MAX_PARENT_DEPTH) => {
  const keywordRegexes = keywords.map(keyword => {
    const escaped = escapeRegex(keyword.toLowerCase());

    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`);
  });

  const getVariants = value => {
    const text = String(value || '');

    return [text.toLowerCase(), text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()];
  };

  const elementHasDeniedKeyword = element => {
    const values = [...getVariants(element.className), ...getVariants(element.id)];

    return keywordRegexes.some(regex => values.some(value => regex.test(value)));
  };

  return input => {
    let current = input.parentElement;
    let depth = 0;

    while (current && current !== document.body && depth < maxDepth) {
      if (elementHasDeniedKeyword(current)) {
        return true;
      }

      current = current.parentElement;
      depth++;
    }

    return false;
  };
};

/**
 * Checks if any parent element of an input contains keywords indicating
 * a non-login form context (newsletter, search, subscribe, etc.).
 * @param {HTMLInputElement} input - The input element to check.
 * @return {boolean} True if a denied keyword is found in parent elements.
 */
const hasParentContextDeniedKeyword = createParentContextChecker(parentContextDeniedKeywords);

export default hasParentContextDeniedKeyword;
