// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import inputSetValue from './autofillFunctions/inputSetValue';

/**
* Checks if autofill should proceed when in an iframe.
* @return {Promise<boolean>} True if should proceed, false if cancelled.
*/
const checkIframePermission = async () => {
  if (window.self === window.top) {
    return true;
  }

  let currentFrameDomain;

  try {
    currentFrameDomain = new URL(window.location.href).hostname;
  } catch (e) {
    CatchError(e);
    return true;
  }

  try {
    const topFrameDomain = new URL(window.top.location.href).hostname;

    if (currentFrameDomain === topFrameDomain) {
      return true;
    }

    const message = browser.i18n.getMessage('autofill_cross_domain_warning')
      .replace('CURRENT_DOMAIN', currentFrameDomain)
      .replace('TOP_DOMAIN', topFrameDomain);

    return window.confirm(message);
  } catch {
    const message = browser.i18n.getMessage('autofill_cross_domain_warning_no_access')
      .replace('CURRENT_DOMAIN', currentFrameDomain);

    return window.confirm(message);
  }
};

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
    localKeyAB = null;
    await CatchError(new TwoFasError(TwoFasError.internalErrors.contentAutofillImportKeyError, { event: e }));
    return { status: 'error', message: 'ImportKey error' };
  }

  localKeyAB = null;

  let valueAB = Base64ToArrayBuffer(encryptedPassword);
  const decryptedBytes = DecryptBytes(valueAB);
  valueAB = null;

  try {
    const decryptedValueAB = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decryptedBytes.iv },
      localKeyCrypto,
      decryptedBytes.data
    );

    localKeyCrypto = null;
    const decryptedValueString = ArrayBufferToString(decryptedValueAB);

    return { status: 'ok', data: decryptedValueString };
  } catch (e) {
    localKeyCrypto = null;
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
* @return {Promise<{status: string, message?: string}>} The status of the autofill operation.
*/
const autofill = async request => {
  if (request.noPassword && request.noUsername) {
    return { status: 'error', message: 'No username and password provided' };
  }

  const passwordInputs = getPasswordInputs();
  const passwordForms = passwordInputs
    .map(input => input.closest('form'))
    .filter(Boolean);
  const usernameInputs = getUsernameInputs(passwordForms);

  setUsernameSkips(passwordInputs, usernameInputs);

  const hasUsernameData = request.username?.length > 0;
  const hasPasswordData = request.password?.length > 0;
  const hasUsernameInput = usernameInputs.length > 0;
  const hasPasswordInput = passwordInputs.length > 0;
  const canFillUsername = hasUsernameData && hasUsernameInput;
  const canFillPassword = hasPasswordData && hasPasswordInput;

  if (!canFillUsername && !canFillPassword) {
    return { status: 'error', message: 'No input fields found' };
  }

  const userAllowed = await checkIframePermission();

  if (!userAllowed) {
    return { status: 'cancelled', message: 'User cancelled cross-domain autofill' };
  }

  if (canFillUsername) {
    usernameInputs.forEach(input => inputSetValue(input, request.username));
  }

  if (canFillPassword) {
    let passwordValue;

    if (request.cryptoAvailable) {
      const decryptResult = await decryptPassword(request.password);

      if (decryptResult.status !== 'ok') {
        return decryptResult;
      }

      passwordValue = decryptResult.data;
    } else {
      passwordValue = request.password;
    }

    passwordInputs.forEach(input => inputSetValue(input, passwordValue));
    passwordValue = null;
  }

  return { status: 'ok' };
};

export default autofill;
