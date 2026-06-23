// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { generateNonce } from '@/partials/functions';

/**
* Normalises flush payloads to the encrypted-mode invariant before they reach the
* background. The save-prompt pipeline (getValuesFromTabsInputData -> decryptValues
* -> checkFormData) assumes every tabsInputData entry shares a single encryption
* state; live capture (handleInputEvent) and the initial scan honour this in
* 'default_encrypted' mode, but flushPendingInputs emits plaintext. In encrypted
* mode this AES-GCM-encrypts each plaintext entry with the local key (identical
* wire format to handleInputEvent), passes through entries that are already
* encrypted (the latestValues fallback), and DROPS any entry it cannot encrypt so
* a plaintext value never lands among encrypted ones. In default mode it is a
* no-op, so plaintext behaviour is unchanged.
* @param {Object[]} pendingData - Flush payloads from flushPendingInputs.
* @param {Object} localKey - The local key object ({ data: CryptoKey|null }).
* @param {boolean} encrypted - Whether the save-prompt runs in encrypted mode.
* @return {Promise<Object[]>} The encryption-normalised payloads.
*/
const encryptFlushData = async (pendingData, localKey, encrypted) => {
  if (!Array.isArray(pendingData) || pendingData.length === 0) {
    return [];
  }

  if (!encrypted) {
    return pendingData;
  }

  const result = [];

  for (const item of pendingData) {
    if (!item) {
      continue;
    }

    if (item.encrypted) {
      result.push(item);
      continue;
    }

    if (!localKey?.data) {
      continue; // cannot encrypt — drop rather than leak plaintext into an encrypted set
    }

    let nonce;

    try {
      nonce = await generateNonce('arraybuffer');
    } catch (e) {
      await CatchError(new TwoFasError(TwoFasError.internalErrors.encryptFlushDataNonceError, { additional: { func: 'encryptFlushData', event: e } }));
      continue;
    }

    let value;

    try {
      value = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce.ArrayBuffer },
        localKey.data,
        StringToArrayBuffer(item.value)
      );
    } catch (e) {
      await CatchError(new TwoFasError(TwoFasError.internalErrors.encryptFlushDataEncryptError, { additional: { func: 'encryptFlushData', event: e } }));
      continue;
    }

    const encryptedValue = EncryptBytes(nonce.ArrayBuffer, value);

    result.push({ ...item, value: ArrayBufferToBase64(encryptedValue), encrypted: true });
  }

  return result;
};

export default encryptFlushData;
