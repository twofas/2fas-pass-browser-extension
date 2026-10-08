// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Reads the password rules of the page's password field (the focused one, otherwise the first).
* Injected with scripting.executeScript({ func }), which serializes it: it must stay
* self-contained — no imports, no references outside its own body.
* @return {Object} The password rules; null values when the page has none.
*/
const readPasswordRules = () => {
  const rules = {
    minLength: null,
    maxLength: null,
    pattern: null
  };

  if (typeof document === 'undefined' || !document) {
    return rules;
  }

  let passwordInput = document.activeElement;

  if (passwordInput?.type !== 'password') {
    passwordInput = document.querySelector('input[type="password"]');
  }

  if (passwordInput && passwordInput.getAttribute) {
    rules.minLength = passwordInput.getAttribute('minlength') || passwordInput.getAttribute('data-minlength') || null;
    rules.maxLength = passwordInput.getAttribute('maxlength') || passwordInput.getAttribute('data-maxlength') || null;
    rules.pattern = passwordInput.getAttribute('pattern') || passwordInput.getAttribute('data-pattern') || null;
  }

  return rules;
};

export default readPasswordRules;
