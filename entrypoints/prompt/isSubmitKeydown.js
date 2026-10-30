// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to tell whether a keydown submits a login form: Enter pressed by the user (not dispatched from a script,
* not confirming composed text) in a password field, a tracked field or any field of a form with a password.
* @param {KeyboardEvent} e - The keydown event.
* @param {HTMLInputElement[]} allInputs - The tracked input elements.
* @return {boolean} True when the keydown submits a login form.
*/
const isSubmitKeydown = (e, allInputs) => {
  if (e?.key !== 'Enter' || e?.isComposing || e?.isTrusted === false) {
    return false;
  }

  const path = typeof e?.composedPath === 'function' ? e.composedPath() : null;
  const target = (path && path[0]) || e?.target;

  if (!target || target.tagName !== 'INPUT') {
    return false;
  }

  const isTracked = target.getAttribute?.('twofas-pass-id') || allInputs.includes(target);
  const form = target.closest?.('form');
  const formHasPassword = form ? form.querySelector('input[type="password"]') : null;

  return Boolean(isTracked || formHasPassword || target.type === 'password');
};

export default isSubmitKeydown;
