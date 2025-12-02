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
* @return {HTMLInputElement[]} The array of password input elements.
*/
const getPasswordInputs = () => {
  const passwordSelector = passwordSelectors().map(selector => selector + ignoredTypes()).join(', ');

  const regularInputs = Array.from(document.querySelectorAll(passwordSelector));

  const shadowRoots = getShadowRoots();
  const shadowInputs = shadowRoots.flatMap(
    root => Array.from(root.querySelectorAll(passwordSelector))
  );

  return [...regularInputs, ...shadowInputs]
    .filter(input => isVisible(input))
    .filter(uniqueElementOnly);
};

export default getPasswordInputs;
