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
 * Checks if autofill should proceed when in an iframe
 * @return {Promise<boolean>} true if should proceed, false if cancelled
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
* Function to autofill input fields.
* @async
* @param {Object} request - The request object.
* @return {Object} The status of the autofill operation.
*/
const autofill = async request => {
  if (request.noPassword && request.noUsername) {
    return { status: 'error', message: 'No username and password provided' };
  }

  const passwordInputs = getPasswordInputs();

  if (passwordInputs.length === 0 && !request?.username) {
    return { status: 'error', message: 'No input fields found' };
  }

  const passwordForms = passwordInputs.map(input => input.closest('form'));
  const usernameInputs = getUsernameInputs(passwordForms);

  setUsernameSkips(passwordInputs, usernameInputs);

  const hasUsernameToFill = usernameInputs.length > 0 && request?.username?.length > 0;
  const hasPasswordToFill = passwordInputs.length > 0 && request?.password?.length > 0;

  if (!hasUsernameToFill && !hasPasswordToFill) {
    return { status: 'error', message: 'No input fields found' };
  }

  const userAllowed = await checkIframePermission();

  if (!userAllowed) {
    return { status: 'cancelled', message: 'User cancelled cross-domain autofill' };
  }

  if (hasUsernameToFill) {
    usernameInputs.forEach(input => inputSetValue(input, request.username));
  }

  if (hasPasswordToFill) {
    let decryptedValueString;

    if (request?.cryptoAvailable) {
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

      const localKeyAB = Base64ToArrayBuffer(localKeyResponse.data);
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
        await CatchError(new TwoFasError(TwoFasError.internalErrors.contentAutofillImportKeyError, { event: e }));
        return { status: 'error', message: 'ImportKey error' };
      }

      const valueAB = Base64ToArrayBuffer(request.password);
      const decryptedBytes = DecryptBytes(valueAB);

      try {
        const decryptedValueAB = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: decryptedBytes.iv },
          localKeyCrypto,
          decryptedBytes.data
        );

        decryptedValueString = ArrayBufferToString(decryptedValueAB);
      } catch (e) {
        await CatchError(new TwoFasError(TwoFasError.internalErrors.contentAutofillDecryptError, { event: e }));
        return { status: 'error', message: 'Decrypt error' };
      }
    } else {
      decryptedValueString = request.password;
    }

    passwordInputs.forEach(input => inputSetValue(input, decryptedValueString));
  }

  return { status: 'ok' };
};

export default autofill;
