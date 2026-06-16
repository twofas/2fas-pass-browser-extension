// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { isVisible, isElementInArray, generateNonce } from '@/partials/functions';
import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import generateInputId from './generateInputId';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';

let untaggedInputCounter = 0;
const untaggedInputKeys = new WeakMap();

/**
* Returns a stable debounce key for an input element. Tagged inputs key by their
* twofas-pass-id; untagged inputs (e.g. dynamically added before they receive an id)
* key by a per-element token kept in a WeakMap, so repeated events on the same element
* reuse the same key and the debounce timer can be cleared correctly.
* @param {HTMLInputElement} input - The input element.
* @return {string} The stable identifier used as the timers key.
*/
const getInputIdentifier = input => {
  const taggedId = input?.getAttribute?.('twofas-pass-id');

  if (taggedId) {
    return taggedId;
  }

  let stableKey = untaggedInputKeys.get(input);

  if (!stableKey) {
    untaggedInputCounter += 1;
    stableKey = `twofas-pass-untagged-${untaggedInputCounter}`;
    untaggedInputKeys.set(input, stableKey);
  }

  return stableKey;
};

/**
* Function to handle input events.
* @async
* @param {Event} e - The input event.
* @param {HTMLInputElement[]} allInputs - The array of all input elements.
* @param {Object} localKey - The local key object.
* @param {Object} timers - An object containing timers to be cleared.
* @param {Object} ignore - A flag to indicate whether to ignore the prompt.
* @param {boolean} encrypted - Flag indicating if the input should be encrypted.
* @param {Object} latestValues - Latest known values per input ID for flush fallback.
* @param {Object} beaconPayloads - Pre-encrypted payloads for beacon flush.
* @return {Promise<void>}
*/
const handleInputEvent = async (e, allInputs, localKey, timers, ignore, encrypted, latestValues, beaconPayloads) => {
  if (ignore?.value || !window?.location?.origin || window?.location?.origin.length <= 0) {
    return; // Ignore the event
  }

  if (!localKey?.data && crypto?.subtle) {
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

        if (encrypted) {
          return;
        }
      }
    } else if (encrypted) {
      return;
    }
  }

  let input = e?.target;

  if (input?.tagName && input.tagName.toLowerCase() !== 'input') {
    const shadowRoots = getShadowRoots(input);
    const shadowInputs = shadowRoots.flatMap(root => Array.from(root.querySelectorAll('input')));

    if (shadowInputs.length > 0) {
      input = shadowInputs[0];
    }
  }

  const skip = input?.getAttribute?.('twofas-pass-skip');
  
  if (!input || !isVisible(input) || skip === 'true') {
    return;
  }

  // Create stable identifier for this input element (works before twofas-pass-id is assigned)
  const inputIdentifier = getInputIdentifier(input);

  // Clear existing timer for this specific input
  if (timers[inputIdentifier]) {
    clearTimeout(timers[inputIdentifier]);
  }

  // Set new timer for this specific input
  timers[inputIdentifier] = setTimeout(async () => {
    const inputId = input?.getAttribute?.('twofas-pass-id');

    if (!inputId && !isElementInArray(input, allInputs)) {
      const documentShadowRoots = getShadowRoots();
      const passwordInputs = getPasswordInputs(documentShadowRoots);
      const passwordForms = passwordInputs
        .map(input => input.closest('form'))
        .filter(Boolean);
      const usernameInputs = getUsernameInputs(passwordForms, documentShadowRoots);
      setUsernameSkips(passwordInputs, usernameInputs, false, passwordForms);

      const allInputsNew = passwordInputs.concat(usernameInputs);

      if (isElementInArray(input, allInputsNew)) {
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

    if (latestValues) {
      latestValues[data.id] = { ...data, sent: false };
    }

    if (beaconPayloads && localKey?.data) {
      if (encrypted) {
        beaconPayloads[data.id] = { ...data, sent: false };
      } else {
        try {
          const beaconNonce = await generateNonce('arraybuffer');
          const beaconEncValue = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: beaconNonce.ArrayBuffer },
            localKey.data,
            StringToArrayBuffer(input.value)
          );
          const beaconEncBytes = EncryptBytes(beaconNonce.ArrayBuffer, beaconEncValue);

          beaconPayloads[data.id] = {
            ...data,
            value: ArrayBufferToBase64(beaconEncBytes),
            encrypted: true,
            sent: false
          };
        } catch {}
      }
    }

    // Clean up timer reference after processing
    delete timers[inputIdentifier];

    try {
      await browser.runtime.sendMessage({
        action: REQUEST_ACTIONS.PROMPT_INPUT,
        data,
        target: REQUEST_TARGETS.BACKGROUND_PROMPT
      });

      if (latestValues?.[data.id]) {
        latestValues[data.id].sent = true;
      }

      if (beaconPayloads?.[data.id]) {
        beaconPayloads[data.id].sent = true;
      }
    } catch {}
  }, config.handleInputEventDebounce || 100);
};

export default handleInputEvent;
