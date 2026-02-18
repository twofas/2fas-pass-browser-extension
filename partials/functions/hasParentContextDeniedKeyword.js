// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { parentContextDeniedKeywords } from '@/constants';

const MAX_PARENT_DEPTH = 8;

const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const keywordRegexes = parentContextDeniedKeywords.map(keyword => {
  const escaped = escapeRegex(keyword.toLowerCase());

  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`);
});

/**
 * Checks if an element's class name or ID contains any denied keywords as whole words.
 * Uses word boundary matching to avoid false positives (e.g. "subscriber" != "subscribe").
 * @param {Element} element - The DOM element to check.
 * @return {boolean} True if a denied keyword is found.
 */
const elementHasDeniedKeyword = element => {
  const className = (element.className || '').toString().toLowerCase();
  const id = (element.id || '').toLowerCase();

  return keywordRegexes.some(regex => regex.test(className) || regex.test(id));
};

/**
 * Checks if any parent element of an input contains keywords indicating
 * a non-login form context (newsletter, search, subscribe, etc.).
 * @param {HTMLInputElement} input - The input element to check.
 * @return {boolean} True if a denied keyword is found in parent elements.
 */
const hasParentContextDeniedKeyword = input => {
  let current = input.parentElement;
  let depth = 0;

  while (current && current !== document.body && depth < MAX_PARENT_DEPTH) {
    if (elementHasDeniedKeyword(current)) {
      return true;
    }

    current = current.parentElement;
    depth++;
  }

  return false;
};

export default hasParentContextDeniedKeyword;
