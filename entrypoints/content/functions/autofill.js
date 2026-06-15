// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { AUTOFILL_RESULT_CODES } from '@/constants';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import inputSetValue from './autofillFunctions/inputSetValue';
import getLoginInputs from './autofillFunctions/getLoginInputs';
import decryptTransmittedValue from './autofillFunctions/decryptTransmittedValue';
import checkCrossDomainFramePermission from './autofillFunctions/checkCrossDomainFramePermission';

/**
* Function to autofill input fields.
* @param {Object} request - The request object containing username and password data.
* @param {string} [request.username] - The username to fill.
* @param {string} [request.password] - The password to fill (may be encrypted).
* @param {boolean} [request.noUsername] - Flag indicating no username is available.
* @param {boolean} [request.noPassword] - Flag indicating no password is available.
* @param {boolean} [request.cryptoAvailable] - Flag indicating password is encrypted.
* @param {boolean} [request.iframePermissionGranted] - Flag indicating cross-domain permission was granted.
* @param {boolean} [request.hasPasswordInAnyFrame] - Flag indicating if any frame has password inputs.
* @return {Promise<{status: string, code?: string, message?: string, canAutofillPassword?: boolean, canAutofillUsername?: boolean}>} The status of the autofill operation.
*/
const autofill = async request => {
  if (request.noPassword && request.noUsername) {
    return { status: 'error', code: AUTOFILL_RESULT_CODES.NO_CREDENTIALS, message: 'No username and password provided' };
  }

  const { passwordInputs, passwordForms, usernameInputs } = getLoginInputs();
  const canAutofillPassword = passwordInputs.length > 0;
  const canAutofillUsername = usernameInputs.length > 0;

  setUsernameSkips(passwordInputs, usernameInputs, request.hasPasswordInAnyFrame, passwordForms);

  const hasUsernameData = request.username?.length > 0;
  const hasPasswordData = request.password?.length > 0;
  const canFillUsername = hasUsernameData && usernameInputs.length > 0;
  const canFillPassword = hasPasswordData && passwordInputs.length > 0;

  if (!canFillUsername && !canFillPassword) {
    return {
      status: 'error',
      code: AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS,
      message: 'No input fields found',
      canAutofillPassword,
      canAutofillUsername
    };
  }

  const { allowed } = checkCrossDomainFramePermission(request);

  if (!allowed) {
    return {
      status: 'cancelled',
      code: AUTOFILL_RESULT_CODES.CROSS_DOMAIN_DENIED,
      message: 'Cross-domain autofill not permitted',
      canAutofillPassword,
      canAutofillUsername
    };
  }

  if (canFillUsername) {
    usernameInputs.forEach(input => inputSetValue(input, request.username, { respectSkipAttribute: false }));
  }

  if (canFillPassword) {
    let passwordValue;

    if (request.cryptoAvailable) {
      const decryptResult = await decryptTransmittedValue(request.password);

      if (decryptResult.status !== 'ok') {
        return { ...decryptResult, canAutofillPassword, canAutofillUsername };
      }

      passwordValue = decryptResult.data;
    } else {
      passwordValue = request.password;
    }

    passwordInputs.forEach(input => inputSetValue(input, passwordValue, { respectSkipAttribute: false }));
    passwordValue = null;
  }

  return { status: 'ok', canAutofillPassword, canAutofillUsername };
};

export default autofill;
