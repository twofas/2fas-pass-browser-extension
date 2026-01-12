// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';

/**
* Function to check and set autofill inputs.
* @return {{canAutofillPassword: boolean, canAutofillUsername: boolean, passwordInputsCount: number, usernameInputsCount: number}} Autofill capability status.
*/
const checkAutofillInputs = () => {
  const passwordInputs = getPasswordInputs();
  const passwordForms = passwordInputs
    .map(input => input.closest('form'))
    .filter(Boolean);
  const usernameInputs = getUsernameInputs(passwordForms);

  setUsernameSkips(passwordInputs, usernameInputs);

  return {
    canAutofillPassword: passwordInputs.length > 0,
    canAutofillUsername: usernameInputs.length > 0,
    passwordInputsCount: passwordInputs.length,
    usernameInputsCount: usernameInputs.length
  };
};

export default checkAutofillInputs;
