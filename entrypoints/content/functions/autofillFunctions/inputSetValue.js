// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isVisible from '@/partials/functions/isVisible';
import getElementInitialScale from './getElementInitialScale';

/** 
* Function to set the value of an input element with a smooth transition effect.
* @param {HTMLElement} el - The input element to set the value for.
* @param {string} value - The value to set for the input element.
* @return {void}
*/
const inputSetValue = (el, value) => {
  const AUTOFILL_TIME = 300;
  const usernameSkipAttribute = el.getAttribute('twofas-pass-skip');

  if (!isVisible(el) || (usernameSkipAttribute && usernameSkipAttribute === 'true')) {
    return;
  }

  const clearEvent = new Event('change', { bubbles: true, cancelable: true });
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });

  const initialElementScale = getElementInitialScale(el);

  setTimeout(() => {
    el.classList.add('twofas-pass-input-autofill');
  }, 10);
  
  setTimeout(() => {
    el.style.scale = `${initialElementScale * 1.05}`;

    if (el.value !== value) {
      el.focus();
      el.value = '';
      el.dispatchEvent(clearEvent);
      el.focus();
      el.value = value;
      el.dispatchEvent(inputEvent);
    }
  }, 20);

  setTimeout(() => {
    el.style.scale = '';
  }, AUTOFILL_TIME);
};

export default inputSetValue;
