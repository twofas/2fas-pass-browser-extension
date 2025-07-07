// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import inputSetValue from './autofillFunctions/inputSetValue';

/* global Event */

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

  let inputFound = false;

  const passwordInputs = getPasswordInputs();
  const passwordForms = passwordInputs.map(input => input.closest('form'));

  const usernameInputs = getUsernameInputs(passwordForms);
  
  setUsernameSkips(passwordInputs, usernameInputs);

  if (usernameInputs.length > 0) {
    inputFound = true;

    if (request?.username && request?.username.length > 0) {
      usernameInputs.map(input => { inputSetValue(input, request.username); });
    }
  }

  if (passwordInputs.length > 0) {
    inputFound = true;

    if (request?.password && request?.password.length > 0) {
      let localKeyResponse = null;
      let localKey = null;
      let decryptedValueString = null;

      if (request?.cryptoAvailable) {
        try {
          localKeyResponse = await browser.runtime.sendMessage({
            action: REQUEST_ACTIONS.GET_LOCAL_KEY,
            target: REQUEST_TARGETS.BACKGROUND
          });
        } catch {}

        if (localKeyResponse?.status === 'ok') {
          localKey = localKeyResponse?.data;
        } else {
          return { status: 'error', message: 'Failed to get local key' };
        }

        const localKeyAB = Base64ToArrayBuffer(localKey);
        let decryptedValueAB, localKeyCrypto;

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
          decryptedValueAB = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: decryptedBytes.iv },
            localKeyCrypto,
            decryptedBytes.data
          );
        } catch (e) {
          await CatchError(new TwoFasError(TwoFasError.internalErrors.contentAutofillDecryptError, { event: e }));
          return { status: 'error', message: 'Decrypt error' };
        }

        decryptedValueString = ArrayBufferToString(decryptedValueAB);
      } else {
        decryptedValueString = request.password;
      }

      passwordInputs.map(input => { inputSetValue(input, decryptedValueString); });
    }
  }

  if (!inputFound) {
    return { status: 'error', message: 'No input fields found' };
  } else {
    return { status: 'ok' };
  }
};

export default autofill;
