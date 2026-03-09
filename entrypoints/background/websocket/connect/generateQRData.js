// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import compressPublicKey from '@/partials/functions/compressPublicKey';

const generateQRData = async (ephemeralPublicKey, sessionID, signature) => {
  try {
    const persistentPublicKey = await storage.getItem('local:persistentPublicKey');
    const persistentPublicKeyAB = Base64ToArrayBuffer(persistentPublicKey);
    const compressedPersistentPublicKeyAB = await compressPublicKey(persistentPublicKeyAB);

    const compressedEphemeralPublicKeyAB = Base64ToArrayBuffer(ephemeralPublicKey);

    const compressedPersistentPublicKeyHex = ArrayBufferToHex(compressedPersistentPublicKeyAB);
    const compressedEphemeralPublicKeyHex = ArrayBufferToHex(compressedEphemeralPublicKeyAB);

    const data = `${config.scheme}:${sessionID}:${compressedPersistentPublicKeyHex}:${compressedEphemeralPublicKeyHex}:${signature}`;
    const dataB64 = btoa(data);

    return dataB64;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateQR, { event: e });
  }
};

export default generateQRData;
