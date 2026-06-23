// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Sets the 'twofas-pass-skip' attribute on username inputs based on the presence of password inputs.
* Username inputs should NOT be skipped if:
* - There are password inputs anywhere (current frame, other frames, or page)
* - The username input is not in a form
* - The username input shares a form with a password input
* Username inputs should be skipped only if:
* - There are no password inputs anywhere AND
* - The username input is in a form that doesn't contain any password inputs
* @param {HTMLInputElement[]} passwordInputs - The password input elements in this frame.
* @param {HTMLInputElement[]} usernameInputs - The username input elements.
* @param {boolean} [hasPasswordInAnyFrame=false] - Whether any frame has password inputs.
* @param {HTMLFormElement[]|null} [passwordForms=null] - Precomputed password forms to reuse; derived from passwordInputs when omitted.
* @return {void}
*/
const setUsernameSkips = (passwordInputs, usernameInputs, hasPasswordInAnyFrame = false, passwordForms = null) => {
  const hasPasswordInputs = passwordInputs.length > 0 || hasPasswordInAnyFrame;

  const resolvedPasswordForms = Array.isArray(passwordForms)
    ? passwordForms
    : passwordInputs.map(input => input.closest('form')).filter(Boolean);
  const passwordFormsSet = new Set(resolvedPasswordForms);

  usernameInputs.forEach(usernameInput => {
    const usernameForm = usernameInput.closest('form');

    if (!usernameForm) {
      usernameInput.setAttribute('twofas-pass-skip', 'false');
      return;
    }

    if (hasPasswordInputs) {
      usernameInput.setAttribute('twofas-pass-skip', 'false');
      return;
    }

    const sharesFormWithPassword = passwordFormsSet.has(usernameForm);

    usernameInput.setAttribute('twofas-pass-skip', sharesFormWithPassword ? 'false' : 'true');
  });
};

export default setUsernameSkips;
