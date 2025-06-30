// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateEncryptionAESKey from './utils/generateEncryptionAESKey';
import addFcmTokenToDevice from './utils/addFcmTokenToDevice';
import addExpirationDateToDevice from './utils/addExpirationDateToDevice';
import checkStorageSessionCapacity from './utils/checkStorageSessionCapacity';
import checkChecksumLength from './utils/checkChecksumLength';
import TwoFasWebSocket from '@/partials/WebSocket';

/** 
* Handles the initialization of the transfer process.
* @param {Object} json - The JSON object containing the transfer data.
* @param {ArrayBuffer} hkdfSaltAB - The salt for HKDF.
* @param {CryptoKey} sessionKeyForHKDF - The session key for HKDF.
* @param {string} uuid - The unique identifier for the user.
* @param {string} deviceId - The unique identifier for the device.
* @return {Promise<Object>} The response object containing the result of the action.
*/
const handleInitTransfer = async (json, hkdfSaltAB, sessionKeyForHKDF, uuid, deviceId) => {
  const { totalChunks, totalSize, sha256GzipVaultDataEnc, newSessionIdEnc } = json.payload;
  let newSessionIdDec_B64;

  checkChecksumLength(sha256GzipVaultDataEnc);
  await checkStorageSessionCapacity(totalSize);

  const encryptionDataKeyAES = await generateEncryptionAESKey(hkdfSaltAB, StringToArrayBuffer('Data'), sessionKeyForHKDF, false);

  try {
    const newSessionIdEncAB = Base64ToArrayBuffer(newSessionIdEnc);
    const newSessionIdDecBytes = DecryptBytes(newSessionIdEncAB);
    const newSessionIdDec_AB = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: newSessionIdDecBytes.iv }, encryptionDataKeyAES, newSessionIdDecBytes.data);
    newSessionIdDec_B64 = ArrayBufferToBase64(newSessionIdDec_AB);
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.decryptNewSessionId, { event: e });
  }

  if (json?.payload?.fcmTokenEnc && json?.payload?.fcmTokenEnc?.length > 0) {
    try {
      const fcmTokenEnc = json.payload.fcmTokenEnc;
      const fcmTokenEncAB = Base64ToArrayBuffer(fcmTokenEnc);
      const fcmTokenDecBytes = DecryptBytes(fcmTokenEncAB);
      const fcmTokenDec_AB = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fcmTokenDecBytes.iv }, encryptionDataKeyAES, fcmTokenDecBytes.data);
      const fcmTokenDec_B64 = ArrayBufferToBase64(fcmTokenDec_AB);
      await addFcmTokenToDevice(uuid, fcmTokenDec_B64);
    } catch (e) {
      throw new TwoFasError(TwoFasError.errors.decryptFcmToken, { event: e });
    }
  }

  let expirationDateDec_B64 = null;

  if (json?.payload?.expirationDateEnc && json?.payload?.expirationDateEnc?.length > 0) {
    try {
      const expirationDateEnc = json.payload.expirationDateEnc;
      const expirationDateEncAB = Base64ToArrayBuffer(expirationDateEnc);
      const expirationDateDecBytes = DecryptBytes(expirationDateEncAB);
      const expirationDateDec_AB = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: expirationDateDecBytes.iv }, encryptionDataKeyAES, expirationDateDecBytes.data);
      expirationDateDec_B64 = ArrayBufferToBase64(expirationDateDec_AB);
    } catch {}
  }

  try {
    await addExpirationDateToDevice(uuid, expirationDateDec_B64);
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.addExpirationDateToDevice, { event: e });
  }

  const socket = TwoFasWebSocket.getInstance();
  await socket.sendMessage({
    id: json.id,
    action: SOCKET_ACTIONS.INIT_TRANSFER_CONFIRMED
  });

  return {
    newSessionId: newSessionIdDec_B64,
    encryptionDataKey: encryptionDataKeyAES,
    totalChunks,
    sha256GzipVaultDataEnc
  };
};

export default handleInitTransfer;
