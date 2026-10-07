// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { ignoredTypes, passwordSelectors } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';
import { isRevealedPasswordInput, rememberPasswordInputs } from './revealedPasswordInputs';

/**
* Gets the password input elements from the document, including those inside shadow DOMs.
* @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @param {Object} [options] - Detection options.
* @param {boolean} [options.includeRevealed=false] - Also return password fields a "show password" toggle switched to type="text".
* @return {HTMLInputElement[]} The array of password input elements, in document order.
*/
const getPasswordInputs = (shadowRoots = null, options = {}) => {
  const { includeRevealed = false } = options;
  const passwordSelector = passwordSelectors().map(selector => selector + ignoredTypes()).join(', ');
  const selector = includeRevealed
    ? `${passwordSelector}, input[type="text" i]${ignoredTypes()}, input:not([type])${ignoredTypes()}`
    : passwordSelector;
  const regularInputs = Array.from(document.querySelectorAll(selector));
  const resolvedShadowRoots = Array.isArray(shadowRoots) ? shadowRoots : getShadowRoots();
  const shadowInputs = resolvedShadowRoots.flatMap(
    root => Array.from(root.querySelectorAll(selector))
  );
  let allInputs = [...regularInputs, ...shadowInputs];

  if (includeRevealed) {
    allInputs = allInputs.filter(input => input.type === 'password' || isRevealedPasswordInput(input));
  }

  const visibleInputs = allInputs.filter(input => isVisible(input));
  const uniqueInputs = visibleInputs.filter(uniqueElementOnly);

  rememberPasswordInputs(uniqueInputs);

  return uniqueInputs;
};

export default getPasswordInputs;
