// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import ignoredTypes from '@/constants/ignoredTypes';
import userNameSelectors from '@/constants/userNameSelectors';
import userNameAttributes from '@/constants/userNameAttributes';
import userNameWords from '@/constants/userNameWords';
import userNameDeniedKeywords from '@/constants/userNameDeniedKeywords';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

/** 
* Gets the username input elements from the document.
* @param {HTMLFormElement[]|null} passwordForms - The password form elements to search within.
* @return {HTMLInputElement[]} The array of username input elements.
*/
const getUsernameInputs = (passwordForms = null) => {
  let userNameInputs = [];

  const userNameSelector = userNameSelectors().map(selector => selector + ignoredTypes()).join(', ');
  userNameInputs = Array.from(document.querySelectorAll(userNameSelector));

  const allInputs = document.querySelectorAll(`input${ignoredTypes()}`);

  allInputs.forEach(input => {
    userNameAttributes.forEach(attribute => {
      userNameWords.forEach(word => {
        if (input.getAttribute(attribute) && input?.getAttribute(attribute)?.toLowerCase().includes(word.toLowerCase())) {
          userNameInputs.push(input);
        }
      })
    });

    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);

      if (label) {
        userNameWords.forEach(word => {
          if (label && label?.innerText?.toLowerCase().includes(word.toLowerCase())) {
            userNameInputs.push(input);
          }
        });
      }
    }
  });

  if (passwordForms && Array.isArray(passwordForms) && userNameInputs.length <= 0) {
    const tryInputSelector = 'input' + ignoredTypes();
    
    passwordForms.forEach(form => {
      if (!form || form instanceof HTMLFormElement === false) {
        return;
      }

      const inputs = form.querySelectorAll(tryInputSelector);

      if (inputs && inputs.length > 0) {
        userNameInputs.push(...inputs);
      }
    });
  }

  userNameInputs = userNameInputs.filter(input => isVisible(input));
  userNameInputs = userNameInputs.filter(uniqueElementOnly);

  userNameInputs = userNameInputs.filter(input => {
    const name = input?.name ? input?.name?.toLowerCase() : '';
    const id = input?.id ? input?.id?.toLowerCase() : '';

    const hasDeniedWord = userNameDeniedKeywords.some(word => name.includes(word) || id.includes(word));
    return !hasDeniedWord;
  });


  if (userNameInputs.length <= 0) {
    const shadowElements = getShadowRoots().filter(el => el?.nodeName?.toLowerCase() === 'input');

    shadowElements.forEach(el => {
      const parent = el.parentNode;
      const shadowInputs = Array.from(parent.querySelectorAll(userNameSelector));
      
      if (shadowInputs && shadowInputs.length > 0) {
        userNameInputs.push(...shadowInputs);
      }
    });

    userNameInputs = userNameInputs.filter(input => isVisible(input));
    userNameInputs = userNameInputs.filter(uniqueElementOnly);
  }

  return userNameInputs;
};

export default getUsernameInputs;
