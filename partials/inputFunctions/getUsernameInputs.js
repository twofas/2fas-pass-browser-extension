// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { ignoredTypes, userNameSelectors, userNameAttributes, userNameWords, userNameDeniedKeywords, personalInfoDeniedKeywords, personalInfoDeniedAutocompleteValues } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';
import hasParentContextDeniedKeyword from '../functions/hasParentContextDeniedKeyword';

const userNameWordsLower = userNameWords.map(word => word.toLowerCase());
let cachedIgnoredTypes = null;
let cachedUserNameSelector = null;

/**
* Returns the ignored input types selector string, computed once and cached for the content script lifetime.
* @return {string} The ignored types selector suffix.
*/
const getIgnoredTypes = () => {
  if (cachedIgnoredTypes === null) {
    cachedIgnoredTypes = ignoredTypes();
  }

  return cachedIgnoredTypes;
};

/**
* Returns the combined username selector string, computed once and cached for the content script lifetime.
* @return {string} The full username CSS selector.
*/
const getUserNameSelector = () => {
  if (cachedUserNameSelector === null) {
    cachedUserNameSelector = userNameSelectors().map(selector => selector + getIgnoredTypes()).join(', ');
  }

  return cachedUserNameSelector;
};

/**
* Filters out inputs that contain denied keywords in their name, id, or parent elements.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input should be kept, false otherwise.
*/
const filterDeniedKeywords = input => {
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase().trim();
  const hasDeniedWord = userNameDeniedKeywords.some(word => name.includes(word) || id.includes(word));

  if (hasDeniedWord) {
    return false;
  }

  if (autocomplete && personalInfoDeniedAutocompleteValues.some(val => autocomplete.includes(val))) {
    return false;
  }

  if (personalInfoDeniedKeywords.some(word => name.includes(word) || id.includes(word))) {
    return false;
  }

  if (hasParentContextDeniedKeyword(input)) {
    return false;
  }

  return true;
};

/**
* Checks if an input matches username-related attributes or has a matching label.
* @param {HTMLInputElement} input - The input element to check.
* @param {Map<string, HTMLLabelElement>} labelMap - Map of label `for` values to label elements within the root node.
* @return {boolean} True if input matches username criteria.
*/
const matchesUsernameInput = (input, labelMap) => {
  const matchesAttribute = userNameAttributes.some(attribute => {
    const attrValue = input.getAttribute(attribute);

    if (!attrValue) {
      return false;
    }

    const lowerAttrValue = attrValue.toLowerCase();

    return userNameWordsLower.some(word => lowerAttrValue.includes(word));
  });

  if (matchesAttribute) {
    return true;
  }

  if (input.id) {
    const label = labelMap.get(input.id);
    const labelText = label?.textContent?.toLowerCase();

    if (labelText && userNameWordsLower.some(word => labelText.includes(word))) {
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
  const allInputs = rootNode.querySelectorAll(`input${getIgnoredTypes()}`);
  const labelMap = new Map();

  rootNode.querySelectorAll('label[for]').forEach(label => {
    const forValue = label.getAttribute('for');

    if (forValue && !labelMap.has(forValue)) {
      labelMap.set(forValue, label);
    }
  });

  allInputs.forEach(input => {
    if (matchesUsernameInput(input, labelMap)) {
      userNameInputs.push(input);
    }
  });

  return userNameInputs;
};

/**
* Checks if an input is inside one of the given forms.
* @param {HTMLInputElement} input - The input element to check.
* @param {HTMLFormElement[]} forms - The forms to check against.
* @return {boolean} True if input is inside one of the forms.
*/
const isInputInForms = (input, forms) => {
  if (!forms || forms.length === 0) {
    return false;
  }

  const inputForm = input.closest('form');

  return forms.some(form => form === inputForm);
};

/**
* Gets the username input elements from the document, including those inside shadow DOMs.
* Prioritizes inputs that share a form with password inputs.
* @param {HTMLFormElement[]|null} passwordForms - The password form elements to search within.
* @return {HTMLInputElement[]} The array of username input elements.
*/
const getUsernameInputs = (passwordForms = null) => {
  const userNameSelector = getUserNameSelector();
  const regularInputs = getUsernameInputsFromRoot(document, userNameSelector);
  const shadowRoots = getShadowRoots();
  const shadowInputs = shadowRoots.flatMap(
    root => getUsernameInputsFromRoot(root, userNameSelector)
  );
  const userNameInputs = [...regularInputs, ...shadowInputs];

  if (passwordForms && Array.isArray(passwordForms) && userNameInputs.length === 0) {
    const tryInputSelector = 'input' + getIgnoredTypes();

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

  const visibleInputs = userNameInputs.filter(input => isVisible(input));
  const uniqueInputs = visibleInputs.filter(uniqueElementOnly);
  const filteredInputs = uniqueInputs.filter(filterDeniedKeywords);

  if (passwordForms && passwordForms.length > 0 && filteredInputs.length > 0) {
    const inputsInPasswordForms = filteredInputs.filter(input => isInputInForms(input, passwordForms));

    if (inputsInPasswordForms.length > 0) {
      return inputsInPasswordForms;
    }
  }

  return filteredInputs;
};

export default getUsernameInputs;
