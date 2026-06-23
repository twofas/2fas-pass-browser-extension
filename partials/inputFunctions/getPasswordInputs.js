// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { ignoredTypes, passwordSelectors } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

/**
* Gets the password input elements from the document, including those inside shadow DOMs.
* @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @return {HTMLInputElement[]} The array of password input elements.
*/
const getPasswordInputs = (shadowRoots = null) => {
  const passwordSelector = passwordSelectors().map(selector => selector + ignoredTypes()).join(', ');
  const regularInputs = Array.from(document.querySelectorAll(passwordSelector));
  const resolvedShadowRoots = Array.isArray(shadowRoots) ? shadowRoots : getShadowRoots();
  const shadowInputs = resolvedShadowRoots.flatMap(
    root => Array.from(root.querySelectorAll(passwordSelector))
  );
  const allInputs = [...regularInputs, ...shadowInputs];
  const visibleInputs = allInputs.filter(input => isVisible(input));
  const uniqueInputs = visibleInputs.filter(uniqueElementOnly);

  return uniqueInputs;
};

export default getPasswordInputs;
