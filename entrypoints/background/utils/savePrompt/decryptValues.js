// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLocalKey from '../getLocalKey';
import decryptValuesProcess from './decryptValuesProcess';

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

  // Process both username and password in parallel
  const [usernameResult, passwordResult] = await Promise.all([
    decryptValuesProcess(values.username, localKeyCrypto),
    decryptValuesProcess(values.password, localKeyCrypto)
  ]);

  // Build return object with successful decryptions only
  const returnObj = {};
  
  if (usernameResult !== null) {
    returnObj.username = usernameResult;
  }
  
  if (passwordResult !== null) {
    returnObj.password = passwordResult;
  }

  return returnObj;
};

export default decryptValues;
