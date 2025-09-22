// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import isText from './isText';
import { SECURITY_TIER } from '@/utils/SECURITY_TIER';

/** 
* Decrypts the password using the encryption key from the session storage.
* @async
* @param {Object} login - The login object containing the password.
* @return {string} - The decrypted password.
*/
const decryptPassword = async login => {
  if (!login?.password || !isText(login?.password) || login?.password?.length === 0) {
    throw new TwoFasError(TwoFasError.internalErrors.decryptPasswordNotDefined, { additional: { func: 'decryptPassword' } });
  }

  if (!login?.deviceId || !isText(login?.deviceId) || login?.deviceId?.length === 0) {
    throw new TwoFasError(TwoFasError.internalErrors.decryptPasswordDeviceIdNotDefined, { additional: { func: 'decryptPassword' } });
  }

  if (!login?.securityType || !Number.isInteger(login?.securityType) || login?.securityType < SECURITY_TIER.HIGHLY_SECRET || login?.securityType > SECURITY_TIER.SECRET) {
    throw new TwoFasError(TwoFasError.internalErrors.decryptPasswordSecurityTypeNotDefined, { additional: { func: 'decryptPassword' } });
  }

  let passwordAB, passwordDecryptedBytes;

  try {
    passwordAB = Base64ToArrayBuffer(login.password);
    passwordDecryptedBytes = DecryptBytes(passwordAB);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.decryptPasswordDecryptBytes, { event: e, additional: { func: 'decryptPassword' } });
  }

  let itemKey;

  try {
    if (login.securityType === SECURITY_TIER.SECRET) {
      if (login?.internalType && login?.internalType === 'added') {
        itemKey = await getKey('item_key_t3_new', { loginId: login.id, deviceId: login.deviceId });
      } else {
        itemKey = await getKey('item_key_t3', { deviceId: login.deviceId });
      }
    } else {
      itemKey = await getKey('item_key_t2', { loginId: login.id, deviceId: login.deviceId });
    }
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.decryptPasswordGetKey, {
      event: e,
      additional: {
        func: 'decryptPassword',
        deviceId: login.deviceId
      }
    });
  }

  let encryptionItemKey;

  try {
    encryptionItemKey = await storage.getItem(`session:${itemKey}`);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.decryptPasswordStorageGetKey, { event: e, additional: { func: 'decryptPassword' } });
  }

  let encryptionItemKeyAB, encryptionKey;

  try {
    encryptionItemKeyAB = Base64ToArrayBuffer(encryptionItemKey);
    encryptionKey = await crypto.subtle.importKey(
      'raw',
      encryptionItemKeyAB,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.decryptPasswordImportKey, { event: e, additional: { func: 'decryptPassword' } });
  }

  let decryptedPassword;

  try {
    decryptedPassword = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: passwordDecryptedBytes.iv },
      encryptionKey,
      passwordDecryptedBytes.data
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.decryptPasswordDecrypt, {
      event: e,
      additional: { func: 'decryptPassword' }
    });
  }

  return ArrayBufferToString(decryptedPassword);
};

export default decryptPassword;
