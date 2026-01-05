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
* @return {void}
*/
const setUsernameSkips = (passwordInputs, usernameInputs, hasPasswordInAnyFrame = false) => {
  const hasPasswordInputs = passwordInputs.length > 0 || hasPasswordInAnyFrame;

  const passwordForms = passwordInputs
    .map(input => input.closest('form'))
    .filter(Boolean);

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

    const sharesFormWithPassword = passwordForms.some(
      passwordForm => passwordForm === usernameForm
    );

    usernameInput.setAttribute('twofas-pass-skip', sharesFormWithPassword ? 'false' : 'true');
  });
};

export default setUsernameSkips;
