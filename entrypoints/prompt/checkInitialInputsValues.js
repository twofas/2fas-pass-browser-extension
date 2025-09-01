
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateNonce from '@/partials/functions/generateNonce';

/**
* Function to check initial input values and send them to background if they have values.
* @param {HTMLInputElement[]} inputs - The array of input elements.
* @param {Object} localKey - The local key object.
* @param {boolean} encrypted - Flag indicating if the input should be encrypted.
* @return {Promise<void>}
*/
const checkInitialInputsValues = async (inputs, localKey, encrypted) => {
  for (const input of inputs) {
    if (!input || !input.value || input.value.length === 0) {
      continue;
    }

    const inputId = input.getAttribute('twofas-pass-id');
    
    if (!inputId) {
      continue;
    }

    const data = {
      id: inputId,
      type: input.type === 'password' ? 'password' : 'username',
      url: window?.location?.origin,
      timestamp: Date.now(),
      encrypted
    };

    if (encrypted) {
      if (!localKey?.data || localKey?.data.length < 0) {
        let localKeyResponse = null;

        try {
          localKeyResponse = await browser.runtime.sendMessage({
            action: REQUEST_ACTIONS.GET_LOCAL_KEY,
            target: REQUEST_TARGETS.BACKGROUND
          });
        } catch {}

        if (localKeyResponse?.status === 'ok' && localKeyResponse?.data && localKeyResponse.data.length > 0) {
          try {
            localKey.data = await crypto.subtle.importKey('raw', Base64ToArrayBuffer(localKeyResponse.data), { name: 'AES-GCM' }, false, ['encrypt']);
          } catch {
            await CatchError(new TwoFasError(TwoFasError.internalErrors.checkInitialInputsValuesKeyImportError));
            return;
          }
        } else {
          return;
        }
      }

      let nonce, value;

      try {
        nonce = await generateNonce('arraybuffer');
      } catch (e) {
        await CatchError(new TwoFasError(TwoFasError.internalErrors.checkInitialInputsValuesNonceError, { additional: { event: e } }));
        continue;
      }

      try {
        value = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce.ArrayBuffer },
          localKey.data,
          StringToArrayBuffer(input.value)
        );
      } catch (e) {
        await CatchError(new TwoFasError(TwoFasError.internalErrors.checkInitialInputsValuesEncryptError, { additional: { event: e } }));
        continue;
      }

      const encryptedValue = EncryptBytes(nonce.ArrayBuffer, value);
      const encryptedValueB64 = ArrayBufferToBase64(encryptedValue);

      data.value = encryptedValueB64;
    } else {
      data.value = input.value;
    }

    await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.PROMPT_INPUT,
      target: REQUEST_TARGETS.BACKGROUND_PROMPT,
      data
    });
  }
};

export default checkInitialInputsValues;
