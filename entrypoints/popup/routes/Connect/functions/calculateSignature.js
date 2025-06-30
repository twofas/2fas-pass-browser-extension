// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import compressPublicKey from '@/partials/functions/compressPublicKey';

/** 
* Function to calculate the signature.
* @async
* @param {string} ephemeralPublicKey - The ephemeral public key.
* @param {string} sessionID - The session ID.
* @return {Promise<string>} A promise that resolves to the calculated signature.
*/
const calculateSignature = async (ephemeralPublicKey, sessionID) => {
  let storagePersistentPublicKeyHex, persistentPrivateKey;

  try {
    const storagePersistentPublicKeyB64 = await storage.getItem('local:persistentPublicKey');
    const storagePersistentPublicKeyAB = Base64ToArrayBuffer(storagePersistentPublicKeyB64);
    const storageCompressedPublicKeyAB = await compressPublicKey(storagePersistentPublicKeyAB);
    storagePersistentPublicKeyHex = ArrayBufferToHex(storageCompressedPublicKeyAB);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.calculateSignaturePublicKeyError, { event: e });
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
    throw new TwoFasError(TwoFasError.internalErrors.calculateSignaturePrivateKeyError, { event: e });
  }

  const ephemeralPublicKeyHex = Base64ToHex(ephemeralPublicKey);

  const data = `${sessionID}${storagePersistentPublicKeyHex}${ephemeralPublicKeyHex}`.toLowerCase();
  const dataArrayBuffer = StringToArrayBuffer(data);

  let signature;

  try {
    signature = await crypto.subtle.sign(
      { name: 'ECDSA', namedCurve: 'P-256', hash: { name: 'SHA-256' } },
      persistentPrivateKey,
      dataArrayBuffer
    );
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.calculateSignatureSignError, { event: e });
  }

  const signatureString = ArrayBufferToHex(signature);
  return signatureString;
};

export default calculateSignature;
