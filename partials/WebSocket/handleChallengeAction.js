// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateNonce from '@/partials/functions/generateNonce';
import importExtensionEphemeralKey from './utils/importExtensionEphemeralKey';
import importMobileEphemeralKey from './utils/importMobileEphemeralKey';
import generateAESKey from './utils/generateAESKey';
import generateSharedSecret from './utils/generateSharedSecret';
import importSharedSecretKey from './utils/importSharedSecretKey';
import generateSessionKeyHKDF from './utils/generateSessionKeyHKDF';
import importSessionKeyForHKDF from './utils/importSessionKeyForHKDF';
import TwoFasWebSocket from '@/partials/WebSocket';

/** 
* Handles the challenge action.
* @param {Object} json - The JSON object containing the challenge data.
* @param {string} uuid - The unique identifier for the user.
* @return {Promise<Object>} The response object containing the challenge result.
*/
const handleChallengeAction = async (json, uuid) => {
  const { pkEpheMa, hkdfSalt } = json.payload;
  const [SK_EPHE_ECDH, PK_EPHE_MA_ECDH, hkdfSaltAB] = await Promise.all([
    importExtensionEphemeralKey(uuid),
    importMobileEphemeralKey(pkEpheMa),
    Base64ToArrayBuffer(hkdfSalt)
  ]);

  const sharedSecretAB = await generateSharedSecret(PK_EPHE_MA_ECDH, SK_EPHE_ECDH);
  const sharedSecretKey = await importSharedSecretKey(sharedSecretAB);
  const sessionKeyHKDF = await generateSessionKeyHKDF(hkdfSaltAB, sharedSecretKey);
  const sessionKeyForHKDF = await importSessionKeyForHKDF(sessionKeyHKDF);
  const sessionKeyAES = await generateAESKey(sessionKeyHKDF);

  const nonce = generateNonce();

  let hkdfSaltEnc;

  try {
    hkdfSaltEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce.ArrayBuffer }, sessionKeyAES, hkdfSaltAB);
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.encryptHkdfSalt, { event: e });
  }

  const encryptedBytes = EncryptBytes(nonce.ArrayBuffer, hkdfSaltEnc);
  const encryptedBytesB64 = ArrayBufferToBase64(encryptedBytes);

  const socket = TwoFasWebSocket.getInstance();
  await socket.sendMessage({
    id: json.id,
    action: SOCKET_ACTIONS.CHALLENGE,
    payload: {
      hkdfSaltEnc: encryptedBytesB64
    }
  });

  return {
    hkdfSalt: hkdfSaltAB,
    pkEpheMa: PK_EPHE_MA_ECDH,
    sessionKeyForHKDF
  };
};

export default handleChallengeAction;
