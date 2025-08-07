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
* @return {Boolean} Returns true if password inputs are found, false otherwise.
*/
const checkAutofillInputs = () => {
  const passwordInputs = getPasswordInputs();
  const passwordForms = passwordInputs.map(input => input.closest('form'));

  const usernameInputs = getUsernameInputs(passwordForms);
  
  setUsernameSkips(passwordInputs, usernameInputs);

  return {
    canAutofillPassword: passwordInputs.length > 0,
    canAutofillUsername: usernameInputs.length > 0
  };
};

export default checkAutofillInputs;
