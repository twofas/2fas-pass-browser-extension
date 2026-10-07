// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { AUTOFILL_RESULT_CODES } from '@/constants';
import trimString from '@/partials/functions/trimString';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import getAutofillPasswordInputs from '@/partials/inputFunctions/getAutofillPasswordInputs';
import { isRevealedPasswordInput } from '@/partials/inputFunctions/revealedPasswordInputs';
import inputSetValue from './autofillFunctions/inputSetValue';
import getLoginInputs from './autofillFunctions/getLoginInputs';
import decryptTransmittedValue from './autofillFunctions/decryptTransmittedValue';
import checkCrossDomainFramePermission from './autofillFunctions/checkCrossDomainFramePermission';

/**
* Tells whether an input may receive the password: a masked password field or a password field a
* "show password" toggle revealed. Re-checked right before the fill, so a detection mistake or a
* DOM change during decryption can never route the password into any other field.
* @param {HTMLInputElement} input - The candidate input element.
* @return {boolean} True if the input is a password field.
*/
const isPasswordTarget = input => input?.type === 'password' || isRevealedPasswordInput(input);

/**
* Function to autofill input fields with the username trimmed (a blank one is not filled) and the password exactly as stored.
* Passwords are never trimmed or changed.
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
  const username = trimString(request.username);
  const hasUsernameData = username?.length > 0;
  const hasPasswordData = request.password?.length > 0;

  if ((request.noPassword && request.noUsername) || (!hasUsernameData && !hasPasswordData)) {
    return { status: 'error', code: AUTOFILL_RESULT_CODES.NO_CREDENTIALS, message: 'No username and password provided' };
  }

  const { passwordInputs, passwordForms, usernameInputs } = getLoginInputs();
  const canAutofillPassword = passwordInputs.length > 0;
  const canAutofillUsername = usernameInputs.length > 0;

  setUsernameSkips(passwordInputs, usernameInputs, request.hasPasswordInAnyFrame, passwordForms);

  // Restrict the fill to the password fields that should receive the stored password: new and
  // confirm fields on multi-field registration and change-password forms are excluded.
  const fillablePasswordInputs = getAutofillPasswordInputs(passwordInputs, usernameInputs);

  const canFillUsername = hasUsernameData && usernameInputs.length > 0;
  const canFillPassword = hasPasswordData && fillablePasswordInputs.length > 0;

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
    usernameInputs
      .filter(input => !isPasswordTarget(input))
      .forEach(input => inputSetValue(input, username, { respectSkipAttribute: false }));
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

    if (!passwordValue && !canFillUsername) {
      return {
        status: 'error',
        code: AUTOFILL_RESULT_CODES.NO_CREDENTIALS,
        message: 'No username and password provided',
        canAutofillPassword,
        canAutofillUsername
      };
    }

    if (passwordValue) {
      fillablePasswordInputs
        .filter(isPasswordTarget)
        .forEach(input => inputSetValue(input, passwordValue, { respectSkipAttribute: false }));
    }

    passwordValue = null;
  }

  return { status: 'ok', canAutofillPassword, canAutofillUsername };
};

export default autofill;
