// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLocalKey from '../getLocalKey';
import decryptValuesProcess from './decryptValuesProcess';

/**
* Resolves the username and password from a save-prompt values object, decrypting
* each field according to its OWN encryption flag (usernameEncrypted /
* passwordEncrypted). A mixed set (one field encrypted, the other plaintext) is
* handled correctly: the encrypted field is AES-GCM-decrypted with the local key
* while the plaintext field passes through untouched (finding #41). The local key
* is imported once, only when at least one field actually needs decrypting.
* @async
* @param {Object} values - { username, password, usernameEncrypted, passwordEncrypted }.
* @return {Promise<Object>} The resolved values (successful results only).
*/
const decryptValues = async values => {
  const usernameNeedsDecrypt = values?.usernameEncrypted === true;
  const passwordNeedsDecrypt = values?.passwordEncrypted === true;

  // Fast path — nothing is encrypted, so no key import is needed.
  if (!usernameNeedsDecrypt && !passwordNeedsDecrypt) {
    const passthrough = {};

    if (values?.username !== undefined) {
      passthrough.username = values.username;
    }

    if (values?.password !== undefined) {
      passthrough.password = values.password;
    }

    return passthrough;
  }

  let localKey, localKeyCrypto;

  try {
    localKey = await getLocalKey();
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.decryptValuesLocalKeyError, {
      additional: { event: e, func: 'decryptValues' }
    });
  }

  const localKeyAB = Base64ToArrayBuffer(localKey);

  try {
    localKeyCrypto = await crypto.subtle.importKey(
      'raw',
      localKeyAB,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.decryptValuesImportKeyError, {
      additional: { event: e, func: 'decryptValues' }
    });
  } finally {
    wipeBuffer(localKeyAB);
  }

  // Decrypt only the fields flagged as encrypted; pass the others through.
  const [usernameResult, passwordResult] = await Promise.all([
    usernameNeedsDecrypt ? decryptValuesProcess(values.username, localKeyCrypto) : Promise.resolve(values?.username ?? null),
    passwordNeedsDecrypt ? decryptValuesProcess(values.password, localKeyCrypto) : Promise.resolve(values?.password ?? null)
  ]);

  // Build return object with successful results only
  const returnObj = {};

  if (usernameResult !== null && usernameResult !== undefined) {
    returnObj.username = usernameResult;
  }

  if (passwordResult !== null && passwordResult !== undefined) {
    returnObj.password = passwordResult;
  }

  return returnObj;
};

export default decryptValues;
