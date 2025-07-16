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
  if (ignore?.value || !window?.location?.origin || window?.location?.origin.length <= 0) {
    return; // Ignore the event
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

    if (localKeyResponse?.status === 'ok' && localKeyResponse?.data && localKeyResponse.data.length > 0) {
      try {
        localKey.data = await crypto.subtle.importKey('raw', Base64ToArrayBuffer(localKeyResponse.data), { name: 'AES-GCM' }, false, ['encrypt'] );
      } catch {
        await CatchError(new TwoFasError(TwoFasError.internalErrors.handleInputEventKeyImportError, { additional: { func: 'handleInputEvent', event: e } }));
        return;
      }
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

  const skip = input?.getAttribute?.('twofas-pass-skip');
  
  if (!input || !isVisible(input) || skip === 'true') {
    return;
  }

  // Create unique identifier for this input element
  const inputIdentifier = input?.getAttribute('twofas-pass-id') || `${input?.name || 'unnamed'}_${input?.type || 'text'}_${Date.now()}`;

  // Clear existing timer for this specific input
  if (timers[inputIdentifier]) {
    clearTimeout(timers[inputIdentifier]);
  }

  // Set new timer for this specific input
  timers[inputIdentifier] = setTimeout(async () => {
    const inputId = input?.getAttribute?.('twofas-pass-id');

    if (!inputId && !isElementInArray(input, allInputs)) {
      const passwordInputs = getPasswordInputs();
      const passwordForms = passwordInputs.map(input => input.closest('form'));
            
      const usernameInputs = getUsernameInputs(passwordForms);
      setUsernameSkips(passwordInputs, usernameInputs);

      const allInputsNew = passwordInputs.concat(usernameInputs);

      if (isElementInArray(input, allInputsNew)) {
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
      timestamp: Date.now(),
      encrypted
    };

    if (encrypted) {
      let nonce, value;

      try {
        nonce = await generateNonce('arraybuffer');
      } catch (e) {
        await CatchError(new TwoFasError(TwoFasError.internalErrors.handleInputEventNonceError, { additional: { func: 'handleInputEvent', event: e } }));
        return;
      }

      try {
        value = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce.ArrayBuffer },
          localKey.data,
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
