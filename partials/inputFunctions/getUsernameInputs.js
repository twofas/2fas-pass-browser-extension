// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { ignoredTypes, userNameSelectors, userNameAttributes, userNameWords, userNameDeniedKeywords } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

/**
* Filters out inputs that contain denied keywords in their name or id.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input should be kept, false otherwise.
*/
const filterDeniedKeywords = input => {
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const hasDeniedWord = userNameDeniedKeywords.some(word => name.includes(word) || id.includes(word));

  return !hasDeniedWord;
};

/**
* Checks if an input matches username-related attributes or has a matching label.
* @param {HTMLInputElement} input - The input element to check.
* @param {Document|ShadowRoot} rootNode - The root node to search for labels.
* @return {boolean} True if input matches username criteria.
*/
const matchesUsernameInput = (input, rootNode) => {
  const matchesAttribute = userNameAttributes.some(attribute => {
    const attrValue = input.getAttribute(attribute);

    if (!attrValue) {
      return false;
    }

    const lowerAttrValue = attrValue.toLowerCase();

    return userNameWords.some(word => lowerAttrValue.includes(word.toLowerCase()));
  });

  if (matchesAttribute) {
    return true;
  }

  if (input.id) {
    const label = rootNode.querySelector(`label[for="${input.id}"]`);
    const labelText = label?.innerText?.toLowerCase();

    if (labelText && userNameWords.some(word => labelText.includes(word.toLowerCase()))) {
      return true;
    }
  }

  return false;
};

/**
* Gets the username input elements from a root node (document or shadow root).
* @param {Document|ShadowRoot} rootNode - The root node to search in.
* @param {string} userNameSelector - The CSS selector for username inputs.
* @return {HTMLInputElement[]} The array of username input elements found.
*/
const getUsernameInputsFromRoot = (rootNode, userNameSelector) => {
  const userNameInputs = Array.from(rootNode.querySelectorAll(userNameSelector));
  const allInputs = rootNode.querySelectorAll(`input${ignoredTypes()}`);

  allInputs.forEach(input => {
    if (matchesUsernameInput(input, rootNode)) {
      userNameInputs.push(input);
    }
  });

  return userNameInputs;
};

/**
* Gets the username input elements from the document, including those inside shadow DOMs.
* @param {HTMLFormElement[]|null} passwordForms - The password form elements to search within.
* @return {HTMLInputElement[]} The array of username input elements.
*/
const getUsernameInputs = (passwordForms = null) => {
  const userNameSelector = userNameSelectors().map(selector => selector + ignoredTypes()).join(', ');

  const regularInputs = getUsernameInputsFromRoot(document, userNameSelector);

  const shadowRoots = getShadowRoots();
  const shadowInputs = shadowRoots.flatMap(
    root => getUsernameInputsFromRoot(root, userNameSelector)
  );

  const userNameInputs = [...regularInputs, ...shadowInputs];

  if (passwordForms && Array.isArray(passwordForms) && userNameInputs.length === 0) {
    const tryInputSelector = 'input' + ignoredTypes();

    passwordForms.forEach(form => {
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      const inputs = form.querySelectorAll(tryInputSelector);

      if (inputs.length > 0) {
        userNameInputs.push(...inputs);
      }
    });
  }

  return userNameInputs
    .filter(input => isVisible(input))
    .filter(uniqueElementOnly)
    .filter(filterDeniedKeywords);
};

export default getUsernameInputs;
