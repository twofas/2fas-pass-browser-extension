// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const FOCUS_RETRY_DELAY = 50;
const FOCUS_MAX_ATTEMPTS = 40;

/**
* Resolves the focusable element behind a ref value: a DOM element, or a component ref exposing getInput().
* @param {Object|HTMLElement|null} element - The ref value.
* @return {HTMLElement|null} The element to focus.
*/
const resolveFocusTarget = element => (typeof element?.getInput === 'function' ? element.getInput() : element);

/**
* Focuses an element as soon as it exists and is enabled — e.g. a lazily loaded masked input that replaces a
* disabled placeholder. Retries every 50 ms, at most 40 times.
* @param {Function} getElement - Returns the current element (or component ref) to focus.
* @return {Function} Cancels the pending retries.
*/
const focusWhenEnabled = getElement => {
  let timeout = null;
  let remainingAttempts = FOCUS_MAX_ATTEMPTS;

  const tryFocus = () => {
    timeout = null;
    const target = resolveFocusTarget(getElement());

    if (target && typeof target.focus === 'function' && !target.disabled) {
      target.focus();
      return;
    }

    remainingAttempts--;

    if (remainingAttempts > 0) {
      timeout = setTimeout(tryFocus, FOCUS_RETRY_DELAY);
    }
  };

  tryFocus();

  return () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
};

export default focusWhenEnabled;
