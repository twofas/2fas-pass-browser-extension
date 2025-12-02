// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isVisible from '@/partials/functions/isVisible';
import getElementInitialScale from './getElementInitialScale';

/**
* Function to set the value of an input element with a smooth transition effect.
* @param {HTMLInputElement} el - The input element to set the value for.
* @param {string} value - The value to set for the input element.
* @return {void}
*/
const inputSetValue = (el, value) => {
  const AUTOFILL_CLASS_DELAY = 10;
  const AUTOFILL_VALUE_DELAY = 20;
  const AUTOFILL_RESET_DELAY = 300;
  const usernameSkipAttribute = el.getAttribute('twofas-pass-skip');

  if (!isVisible(el) || usernameSkipAttribute === 'true') {
    return;
  }

  const initialElementScale = getElementInitialScale(el);

  setTimeout(() => {
    if (!el.isConnected) {
      return;
    }

    el.classList.add('twofas-pass-input-autofill');
  }, AUTOFILL_CLASS_DELAY);

  setTimeout(() => {
    if (!el.isConnected) {
      return;
    }

    el.style.scale = `${initialElementScale * 1.05}`;

    if (el.value !== value) {
      el.focus();
      el.value = '';
      el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }
  }, AUTOFILL_VALUE_DELAY);

  setTimeout(() => {
    if (!el.isConnected) {
      return;
    }

    el.style.scale = '';
    el.classList.remove('twofas-pass-input-autofill');
  }, AUTOFILL_RESET_DELAY);
};

export default inputSetValue;
