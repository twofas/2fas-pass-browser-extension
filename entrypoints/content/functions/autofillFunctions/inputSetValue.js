// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isVisible from '@/partials/functions/isVisible';
import animateAutofilledInput from './animateAutofilledInput';

/**
* Function to set the value of an input element with a smooth transition effect.
* @param {HTMLInputElement} el - The input element to set the value for.
* @param {string} value - The value to set for the input element.
* @param {Object} options - Optional configuration object.
* @param {boolean} options.respectSkipAttribute - Whether to respect the twofas-pass-skip attribute (default: true).
* @return {void}
*/
const inputSetValue = (el, value, options = {}) => {
  const { respectSkipAttribute = true } = options;

  if (!isVisible(el)) {
    return;
  }

  if (respectSkipAttribute) {
    const skipAttribute = el.getAttribute('twofas-pass-skip');

    if (skipAttribute === 'true') {
      return;
    }
  }

  animateAutofilledInput(el);

  el.focus();

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    nativeInputValueSetter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  } else {
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }
};

export default inputSetValue;
