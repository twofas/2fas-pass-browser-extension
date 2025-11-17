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
* Gets the password input elements from the document.
* @return {HTMLInputElement[]} The array of password input elements.
*/
const getPasswordInputs = () => {
  let passwordInputs = [];

  const passwordSelector = passwordSelectors().map(selector => selector + ignoredTypes()).join(', ');
  passwordInputs = Array.from(document.querySelectorAll(passwordSelector));

  passwordInputs = passwordInputs.filter(input => isVisible(input));
  passwordInputs = passwordInputs.filter(uniqueElementOnly);

  if (passwordInputs.length <= 0) {
    const shadowElements = getShadowRoots().filter(el => el?.nodeName?.toLowerCase() === 'input');
    
    shadowElements.forEach(el => {
      const parent = el.parentNode;
      const shadowInputs = Array.from(parent.querySelectorAll(passwordSelector));
      
      if (shadowInputs && shadowInputs.length > 0) {
        shadowInputs.forEach(input => {
          passwordInputs.push(input);
        });
      }
    });

    passwordInputs = passwordInputs.filter(uniqueElementOnly);
    passwordInputs = passwordInputs.filter(input => isVisible(input));
  }

  return passwordInputs;
};

export default getPasswordInputs;
