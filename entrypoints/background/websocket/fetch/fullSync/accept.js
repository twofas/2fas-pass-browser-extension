// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import checkStorageSessionCapacity from '../../utils/checkStorageSessionCapacity';
import checkChecksumLength from '../../utils/checkChecksumLength';
import generateEncryptionAESKey from '../../utils/generateEncryptionAESKey';
import addExpirationDateToDevice from '../../utils/addExpirationDateToDevice';
import { ENCRYPTION_KEYS } from '@/constants';
import TwoFasWebSocket from '../..';

/**
* Function to handle the full sync acceptance.
* @async
* @param {Object} data - The decrypted pull request action data.
* @param {Object} state - The current state of the socket connection.
* @param {ArrayBuffer} hkdfSaltAB - The salt for HKDF.
* @param {CryptoKey} sessionKeyForHKDF - The session key for HKDF.
* @param {string} messageId - The ID of the message to confirm.
*/
const fullSyncAccept = async (data, state, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  const { totalChunks, totalSize, sha256GzipVaultDataEnc } = data;

  checkChecksumLength(sha256GzipVaultDataEnc);
  await checkStorageSessionCapacity(totalSize);

  const encryptionDataKeyAES = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.DATA.crypto, sessionKeyForHKDF, false);

  // OPTIONAL - unlike initTransfer, an absent field means "not reported", so the stored date is kept
  if (data?.expirationDateEnc && data?.expirationDateEnc?.length > 0) {
    let expirationDateDec_B64;

    try {
      const expirationDateEncAB = Base64ToArrayBuffer(data.expirationDateEnc);
      const expirationDateDecBytes = DecryptBytes(expirationDateEncAB);
      const expirationDateDec_AB = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: expirationDateDecBytes.iv }, encryptionDataKeyAES, expirationDateDecBytes.data);
      expirationDateDec_B64 = ArrayBufferToBase64(expirationDateDec_AB);
    } catch (e) {
      throw new TwoFasError(TwoFasError.errors.decryptExpirationDate, { event: e });
    }

    try {
      await addExpirationDateToDevice({ uuid: state?.uuid, deviceId: state?.deviceId }, expirationDateDec_B64);
    } catch (e) {
      await CatchError(new TwoFasError(TwoFasError.errors.addExpirationDateToDevice, { event: e }));
    }
  }

  state.sha256GzipVaultDataEnc = sha256GzipVaultDataEnc;
  state.totalChunks = totalChunks;
  state.encryptionDataKeyAES = encryptionDataKeyAES;
  state.chunks = [];

  const socket = TwoFasWebSocket.getInstance();
  await socket.sendMessage({
    id: messageId,
    action: SOCKET_ACTIONS.INIT_TRANSFER_CONFIRMED
  });
};

export default fullSyncAccept;
