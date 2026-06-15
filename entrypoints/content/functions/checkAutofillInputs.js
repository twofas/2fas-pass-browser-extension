// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import getLoginInputs from './autofillFunctions/getLoginInputs';

/**
* Function to check and set autofill inputs.
* @return {{canAutofillPassword: boolean, canAutofillUsername: boolean, passwordInputsCount: number, usernameInputsCount: number}} Autofill capability status.
*/
const checkAutofillInputs = () => {
  const { passwordInputs, passwordForms, usernameInputs } = getLoginInputs();

  setUsernameSkips(passwordInputs, usernameInputs, false, passwordForms);

  const result = {
    canAutofillPassword: passwordInputs.length > 0,
    canAutofillUsername: usernameInputs.length > 0,
    passwordInputsCount: passwordInputs.length,
    usernameInputsCount: usernameInputs.length
  };

  logger.debug(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'ContentScript-FormDetect - inputs scanned', result);

  return result;
};

export default checkAutofillInputs;
