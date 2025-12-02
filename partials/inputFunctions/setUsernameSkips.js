// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Sets the 'twofas-pass-skip' attribute on username inputs based on the presence of password inputs.
* Username inputs that share a form with at least one password input should NOT be skipped.
* Username inputs in different forms than all password inputs should be skipped.
* @param {HTMLInputElement[]} passwordInputs - The password input elements.
* @param {HTMLInputElement[]} usernameInputs - The username input elements.
* @return {void}
*/
const setUsernameSkips = (passwordInputs, usernameInputs) => {
  const passwordForms = passwordInputs
    .map(input => input.closest('form'))
    .filter(Boolean);

  usernameInputs.forEach(usernameInput => {
    const usernameForm = usernameInput.closest('form');

    if (!usernameForm) {
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
