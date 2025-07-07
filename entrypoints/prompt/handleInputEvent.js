// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isVisible from '@/partials/functions/isVisible';
import isElementInArray from '@/partials/functions/isElementInArray';
import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import generateInputId from './generateInputId';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import generateNonce from '@/partials/functions/generateNonce';

/** 
* Function to handle input events.
* @async
* @param {Event} e - The input event.
* @param {HTMLInputElement[]} allInputs - The array of all input elements.
* @param {Object} localKey - The local key object.
* @param {Object} timers - An object containing timers to be cleared.
* @param {Object} ignore - A flag to indicate whether to ignore the prompt.
* @param {boolean} encrypted - Flag indicating if the input should be encrypted.
* @return {Promise<void>} 
*/
const handleInputEvent = async (e, allInputs, localKey, timers, ignore, encrypted) => {
  if (ignore?.value) {
    return; // Ignore the event if ignore flag is set
  }

  // FUTURE - save crypto key?
  if (encrypted && (!localKey?.data || localKey?.data.length < 0)) {
    let localKeyResponse = null;

    try {
      localKeyResponse = await browser.runtime.sendMessage({
        action: REQUEST_ACTIONS.GET_LOCAL_KEY,
        target: REQUEST_TARGETS.BACKGROUND
      });
    } catch {}

    if (localKeyResponse?.status === 'ok') {
      localKey.data = localKeyResponse?.data;
    } else {
      return;
    }
  }

  // Get input element and create unique identifier for debouncing
  let input = e?.target;
  
  if (input?.tagName && input.tagName.toLowerCase() !== 'input') {
    const shadowElements = getShadowRoots(input).filter(el => el?.nodeName?.toLowerCase() === 'input');
    
    if (shadowElements && shadowElements.length > 0) {
      input = shadowElements[0]; // FUTURE - Check if the input is the correct one
    }
  }

  // Create unique identifier for this input element
  const inputIdentifier = input?.getAttribute('twofas-pass-id') || `${input?.name || 'unnamed'}_${input?.type || 'text'}_${Date.now()}`;

  // Clear existing timer for this specific input
  if (timers[inputIdentifier]) {
    clearTimeout(timers[inputIdentifier]);
  }

  // Set new timer for this specific input
  timers[inputIdentifier] = setTimeout(async () => {
    if (!window?.location?.origin || window?.location?.origin.length <= 0) {
      return;
    }

    let skip = false;

    if (input?.getAttribute && typeof input?.getAttribute === 'function') {
      skip = input.getAttribute('twofas-pass-skip');
    }

    if (
      !input ||
      !isVisible(input) ||
      (skip && skip === 'true')
    ) {
      delete timers[inputIdentifier]; // Clean up timer reference
      return;
    }

    const inputId = input.getAttribute('twofas-pass-id');

    if (!inputId && !isElementInArray(input, allInputs)) {
      const passwordInputs = getPasswordInputs();
      const passwordForms = passwordInputs.map(input => input.closest('form'));
            
      const usernameInputs = getUsernameInputs(passwordForms);
      setUsernameSkips(passwordInputs, usernameInputs);

      const allInputsNew = passwordInputs.concat(usernameInputs);

      if (isElementInElementInArray(input, allInputsNew)) {
        allInputs = allInputsNew;
        const inputId = generateInputId();
        // FUTURE - Check if the ID is unique
        input.setAttribute('twofas-pass-id', inputId);
      } else {
        input.setAttribute('twofas-pass-skip', 'true');
        delete timers[inputIdentifier]; // Clean up timer reference
        return;
      }
    }

    const data = {
      id: input.getAttribute('twofas-pass-id'),
      type: input.type === 'password' ? 'password' : 'username',
      url: window?.location?.origin,
      timestamp: new Date().valueOf(),
      encrypted
    };

    if (encrypted) {
      let nonce, localKeyCrypto, value;

      try {
        const promises = [generateNonce(), crypto.subtle.importKey('raw', Base64ToArrayBuffer(localKey.data), { name: 'AES-GCM' }, false, ['encrypt'] )];
        [nonce, localKeyCrypto] = await Promise.all(promises);
      } catch (e) {
        const errorType = e.message?.includes('generateNonce') ? TwoFasError.internalErrors.handleInputEventNonceError : TwoFasError.internalErrors.handleInputEventKeyImportError;
        await CatchError(new TwoFasError(errorType, { additional: { func: 'handleInputEvent', event: e } }));
        return;
      }

      try {
        value = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce.ArrayBuffer },
          localKeyCrypto,
          StringToArrayBuffer(input.value)
        );
      } catch (e) {
        await CatchError(new TwoFasError(TwoFasError.internalErrors.handleInputEventEncryptError, { additional: { func: 'handleInputEvent', event: e } }));
        return;
      }

      const encryptedValue = EncryptBytes(nonce.ArrayBuffer, value);
      const encryptedValueB64 = ArrayBufferToBase64(encryptedValue);

      data.value = encryptedValueB64;
    } else {
      data.value = input.value;
    }

    // Clean up timer reference after processing
    delete timers[inputIdentifier];

    return browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.PROMPT_INPUT,
      data,
      target: REQUEST_TARGETS.BACKGROUND_PROMPT
    });
  }, config.handleInputEventDebounce || 100);
};

export default handleInputEvent;
