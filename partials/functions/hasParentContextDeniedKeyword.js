// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { parentContextDeniedKeywords } from '@/constants';

const MAX_PARENT_DEPTH = 8;

/**
 * Checks if an element's class name or ID contains any denied keywords.
 * @param {Element} element - The DOM element to check.
 * @return {boolean} True if a denied keyword is found.
 */
const elementHasDeniedKeyword = element => {
  const className = (element.className || '').toString().toLowerCase();
  const id = (element.id || '').toLowerCase();

  return parentContextDeniedKeywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();

    return className.includes(lowerKeyword) || id.includes(lowerKeyword);
  });
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
