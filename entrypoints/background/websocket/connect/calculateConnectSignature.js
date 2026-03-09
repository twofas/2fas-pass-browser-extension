// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import compressPublicKey from '@/partials/functions/compressPublicKey';

/** 
* Function to calculate the signature in QR Connect.
* @async
* @param {string} ephemeralPublicKey - The ephemeral public key.
* @param {string} sessionID - The session ID.
* @return {Promise<string>} A promise that resolves to the calculated signature.
*/
const calculateConnectSignature = async (ephemeralPublicKey, sessionID) => {
  let storagePersistentPublicKeyHex, persistentPrivateKey, storageCompressedPublicKeyAB;

  try {
    const [storagePersistentPublicKeyB64, storagePersistentPrivateKey] = await Promise.all([
      storage.getItem('local:persistentPublicKey'),
      storage.getItem('local:persistentPrivateKey')
    ]);

    const [storagePersistentPublicKeyAB, persistentPrivateKeyArrayBuffer] = await Promise.all([
      Promise.resolve(Base64ToArrayBuffer(storagePersistentPublicKeyB64)),
      Promise.resolve(Base64ToArrayBuffer(storagePersistentPrivateKey))
    ]);

    [storageCompressedPublicKeyAB, persistentPrivateKey] = await Promise.all([
      compressPublicKey(storagePersistentPublicKeyAB),
      crypto.subtle.importKey(
        'pkcs8',
        persistentPrivateKeyArrayBuffer,
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign']
      )
    ]);

    storagePersistentPublicKeyHex = ArrayBufferToHex(storageCompressedPublicKeyAB);
  } catch (e) {
    const isPrivateKeyError = e.message?.includes('pkcs8') || e.message?.includes('sign');
    const errorType = isPrivateKeyError 
      ? TwoFasError.internalErrors.calculateSignaturePrivateKeyError
      : TwoFasError.internalErrors.calculateSignaturePublicKeyError;
    
    throw new TwoFasError(errorType, { event: e });
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

export default calculateConnectSignature;
