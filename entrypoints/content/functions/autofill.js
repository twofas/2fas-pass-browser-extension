// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { AUTOFILL_RESULT_CODES } from '@/constants';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import isTopFrame from '@/partials/functions/isTopFrame';
import getFrameHostname from '@/partials/functions/getFrameHostname';
import inputSetValue from './autofillFunctions/inputSetValue';
import getLoginInputs from './autofillFunctions/getLoginInputs';

/**
* Decrypts an encrypted password using the local key.
* @param {string} encryptedPassword - The base64 encoded encrypted password.
* @return {Promise<{status: string, data?: string, message?: string}>} Decryption result.
*/
const decryptPassword = async encryptedPassword => {
  let localKeyResponse;

  try {
    localKeyResponse = await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.GET_LOCAL_KEY,
      target: REQUEST_TARGETS.BACKGROUND
    });
  } catch {
    return { status: 'error', message: 'Failed to get local key' };
  }

  if (localKeyResponse?.status !== 'ok') {
    return { status: 'error', message: 'Failed to get local key' };
  }

  let localKeyAB = Base64ToArrayBuffer(localKeyResponse.data);
  let localKeyCrypto;

  try {
    localKeyCrypto = await crypto.subtle.importKey(
      'raw',
      localKeyAB,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
  } catch (e) {
    wipeBuffer(localKeyAB);
    localKeyAB = null;
    await CatchError(new TwoFasError(TwoFasError.internalErrors.contentAutofillImportKeyError, { event: e }));
    return { status: 'error', message: 'ImportKey error' };
  }

  wipeBuffer(localKeyAB);
  localKeyAB = null;

  let valueAB = Base64ToArrayBuffer(encryptedPassword);
  let decryptedBytes = DecryptBytes(valueAB);
  wipeBuffer(valueAB);
  valueAB = null;

  try {
    let decryptedValueAB = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decryptedBytes.iv },
      localKeyCrypto,
      decryptedBytes.data
    );

    localKeyCrypto = null;
    wipeBuffer(decryptedBytes?.iv);
    wipeBuffer(decryptedBytes?.data);
    decryptedBytes = null;

    const decryptedValueString = ArrayBufferToString(decryptedValueAB);
    wipeBuffer(decryptedValueAB);
    decryptedValueAB = null;

    return { status: 'ok', data: decryptedValueString };
  } catch (e) {
    localKeyCrypto = null;
    wipeBuffer(decryptedBytes?.iv);
    wipeBuffer(decryptedBytes?.data);
    decryptedBytes = null;
    await CatchError(new TwoFasError(TwoFasError.internalErrors.contentAutofillDecryptError, { event: e }));
    return { status: 'error', message: 'Decrypt error' };
  }
};

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

  const { passwordInputs, usernameInputs } = getLoginInputs();
  const canAutofillPassword = passwordInputs.length > 0;
  const canAutofillUsername = usernameInputs.length > 0;

  setUsernameSkips(passwordInputs, usernameInputs, request.hasPasswordInAnyFrame);

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

  if (!isTopFrame()) {
    let isCrossDomain = false;
    const frameHostname = getFrameHostname();

    try {
      const topHostname = new URL(window.top.location.href).hostname;
      isCrossDomain = frameHostname !== topHostname;
    } catch {
      isCrossDomain = true;
    }

    if (isCrossDomain) {
      if (request.crossDomainAllowedDomains) {
        if (!request.crossDomainAllowedDomains.includes(frameHostname)) {
          return {
            status: 'cancelled',
            code: AUTOFILL_RESULT_CODES.CROSS_DOMAIN_DENIED,
            message: 'Cross-domain autofill not permitted',
            canAutofillPassword,
            canAutofillUsername
          };
        }
      } else if (!request.iframePermissionGranted) {
        return {
          status: 'cancelled',
          code: AUTOFILL_RESULT_CODES.CROSS_DOMAIN_DENIED,
          message: 'Cross-domain autofill not permitted',
          canAutofillPassword,
          canAutofillUsername
        };
      }
    }
  }

  if (canFillUsername) {
    usernameInputs.forEach(input => inputSetValue(input, request.username, { respectSkipAttribute: false }));
  }

  if (canFillPassword) {
    let passwordValue;

    if (request.cryptoAvailable) {
      const decryptResult = await decryptPassword(request.password);

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
