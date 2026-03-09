// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import compressPublicKey from '@/partials/functions/compressPublicKey';

/**
* Function to calculate the signature in fetch.
* @async
* @param {string} sessionId - The session ID.
* @param {string} deviceId - The device ID.
* @param {string} deviceUUID - The device UUID.
* @param {string} timestamp - The timestamp.
* @return {Promise<string>} The calculated signature.
*/
const calculateFetchSignature = async (sessionId, deviceId, deviceUUID, timestamp) => {
  let ephemeralPublicKeyHex, persistentPrivateKey;

  try {
    const storageEphemeralPublicKeyKey = await getKey('ephe_public_key', { uuid: deviceUUID });
    const storageEphemeralPublicKey = await storage.getItem(`session:${storageEphemeralPublicKeyKey}`);
    const storageEphemeralPublicKeyAB = Base64ToArrayBuffer(storageEphemeralPublicKey);
    const storageCompressedPublicKeyAB = await compressPublicKey(storageEphemeralPublicKeyAB);
    ephemeralPublicKeyHex = ArrayBufferToHex(storageCompressedPublicKeyAB);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.calculateSignatureFetchPublicKeyError, { event: e });
  }
    
  try {
    const storagePersistentPrivateKey = await storage.getItem('local:persistentPrivateKey');
    const persistentPrivateKeyArrayBuffer = Base64ToArrayBuffer(storagePersistentPrivateKey);
    persistentPrivateKey = await crypto.subtle.importKey(
      'pkcs8',
      persistentPrivateKeyArrayBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign']
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.calculateSignatureFetchPrivateKeyError, { event: e });
  }

  const data = `${sessionId}${deviceId}${ephemeralPublicKeyHex}${timestamp}`.toLowerCase();
  const dataArrayBuffer = StringToArrayBuffer(data);

  let signature;

  try {
    signature = await crypto.subtle.sign(
      { name: 'ECDSA', namedCurve: 'P-256', hash: { name: 'SHA-256' } },
      persistentPrivateKey,
      dataArrayBuffer
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.calculateSignatureFetchSignError, { event: e });
  }

  const signatureString = ArrayBufferToBase64(signature);
  return signatureString;
};

export default calculateFetchSignature;
