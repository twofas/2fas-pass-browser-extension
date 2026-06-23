// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Decrypts a value transmitted from the background using the local key.
* Single source of truth for content-script transmission decryption shared by
* autofill() (login password) and autofillCard() (card number / expiration date /
* security code), so the AES-GCM import, DecryptBytes split, decrypt and buffer
* wiping can never drift between the login and card paths.
* @param {string} encryptedValue - The base64 encoded encrypted value.
* @return {Promise<{status: string, data?: string, message?: string}>} Decryption result.
*/
const decryptTransmittedValue = async encryptedValue => {
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

  let valueAB = Base64ToArrayBuffer(encryptedValue);
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

export default decryptTransmittedValue;
