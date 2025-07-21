// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLocalKey from '../getLocalKey';

// @TODO: Refactor this (Promise.all, etc.)
const decryptValues = async values => {
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
  }

  let usernameAB, passwordAB;
  let usernameOk = true;
  let passwordOk = true;

  try {
    usernameAB = Base64ToArrayBuffer(values.username);
  } catch {
    usernameOk = false;
  }

  try {
    passwordAB = Base64ToArrayBuffer(values.password);
  } catch {
    passwordOk = false;
  }

  let usernameDecryptedBytes, passwordDecryptedBytes;

  if (usernameOk) {
    try {
      usernameDecryptedBytes = DecryptBytes(usernameAB);
    } catch {
      usernameOk = false;
    }
  }

  if (passwordOk) {
    try {
      passwordDecryptedBytes = DecryptBytes(passwordAB);
    } catch {
      passwordOk = false;
    }
  }

  let decryptedUsernameAB, decryptedPasswordAB;

  if (usernameOk) {
    try {
      decryptedUsernameAB = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: usernameDecryptedBytes.iv },
        localKeyCrypto,
        usernameDecryptedBytes.data
      );
    } catch {
      usernameOk = false;
    }
  }

  if (passwordOk) {
    try {
      decryptedPasswordAB = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: passwordDecryptedBytes.iv },
        localKeyCrypto,
        passwordDecryptedBytes.data
      );
    } catch {
      passwordOk = false;
    }
  }

  const returnObj = {};

  if (usernameOk) {
    returnObj.username = ArrayBufferToString(decryptedUsernameAB);
  }

  if (passwordOk) {
    returnObj.password = ArrayBufferToString(decryptedPasswordAB);
  }

  return returnObj;
};

export default decryptValues;
