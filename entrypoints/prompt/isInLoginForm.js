// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getPromptInputType from './getPromptInputType';

/**
* How many ancestors of a form-less control are searched for the password field.
* @type {number}
*/
const MAX_FORMLESS_DEPTH = 6;

/**
* Function to tell whether an element (a submit control, a field or a form) belongs to the login form of a tracked
* password field: the same form, or without a form, a block at most 6 ancestors up that holds the password field.
* @param {Element} element - The element.
* @param {HTMLInputElement[]} allInputs - The tracked input elements.
* @return {boolean} True when the element belongs to a login form.
*/
const isInLoginForm = (element, allInputs) => {
  if (!element || !Array.isArray(allInputs)) {
    return false;
  }

  const passwordInputs = allInputs.filter(input => input?.isConnected && getPromptInputType(input) === 'password');

  if (passwordInputs.length <= 0) {
    return false;
  }

  if (passwordInputs.includes(element)) {
    return true;
  }

  const form = element.tagName === 'FORM' ? element : (element.form || element.closest?.('form'));

  if (form) {
    return passwordInputs.some(input => input.form === form || form.contains(input));
  }

  let node = element.parentElement;

  for (let depth = 0; depth < MAX_FORMLESS_DEPTH && node && node !== document.body && node !== document.documentElement; depth++) {
    const ancestor = node;

    if (passwordInputs.some(input => ancestor.contains(input))) {
      return true;
    }

    node = node.parentElement;
  }

  return false;
};

export default isInLoginForm;
