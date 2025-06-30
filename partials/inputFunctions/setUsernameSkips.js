// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Sets the 'twofas-pass-skip' attribute on username inputs based on the presence of password inputs.
* @param {HTMLInputElement[]} passwordInputs - The password input elements.
* @param {HTMLInputElement[]} usernameInputs - The username input elements.
* @return {void}
*/
const setUsernameSkips = (passwordInputs, usernameInputs) => {
  passwordInputs.forEach(input => {
    const closestPasswordForm = input.closest('form');

    if (closestPasswordForm) {
      usernameInputs.forEach(usernameInput => {
        const closestUsernameForm = usernameInput.closest('form');

        if (closestUsernameForm) {
          if (!closestPasswordForm.isEqualNode(closestUsernameForm)) {
            const usernameSkipAttribute = usernameInput.getAttribute('twofas-pass-skip');
  
            if (!usernameSkipAttribute || usernameSkipAttribute !== 'false') {
              usernameInput.setAttribute('twofas-pass-skip', 'true');
            }
          } else {
            usernameInput.setAttribute('twofas-pass-skip', 'false');
          }
        }
      });
    } else {
      usernameInputs.forEach(usernameInput => {
        usernameInput.setAttribute('twofas-pass-skip', 'false');
      });
    }
  });
};

export default setUsernameSkips;
