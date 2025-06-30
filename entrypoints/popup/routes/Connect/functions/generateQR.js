// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import qrcode from 'qrcode';
import compressPublicKey from '@/partials/functions/compressPublicKey';

/** 
* Function to generate a QR code.
* @param {string} ephemeralPublicKey - The ephemeral public key.
* @param {string} sessionID - The session ID.
* @param {string} signature - The signature.
* @return {Promise<string>} A promise that resolves to the generated QR code.
*/
const generateQR = async (ephemeralPublicKey, sessionID, signature) => {
  try {
    const persistentPublicKey = await storage.getItem('local:persistentPublicKey');
    const persistentPublicKeyAB = Base64ToArrayBuffer(persistentPublicKey);
    const compressedPersistentPublicKeyAB = await compressPublicKey(persistentPublicKeyAB);

    const compressedEphemeralPublicKeyAB = Base64ToArrayBuffer(ephemeralPublicKey);
  
    const compressedPersistentPublicKeyHex = ArrayBufferToHex(compressedPersistentPublicKeyAB);
    const compressedEphemeralPublicKeyHex = ArrayBufferToHex(compressedEphemeralPublicKeyAB);
  
    const data = `${config.scheme}:${sessionID}:${compressedPersistentPublicKeyHex}:${compressedEphemeralPublicKeyHex}:${signature}`;
    const dataB64 = btoa(data);
  
    const qrCode = await qrcode.toDataURL(dataB64,
      {
        type: 'image/jpeg',
        errorCorrectionLevel: 'L',
        quality: 1,
        width: 750
      });
  
    return qrCode;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateQR, { event: e });
  }
};

export default generateQR;
