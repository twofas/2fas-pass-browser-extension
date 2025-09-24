// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateEncryptionAESKey from './utils/generateEncryptionAESKey';
import saveServices from './utils/saveServices';
import saveTags from './utils/saveTags';
import getKey from '@/partials/sessionStorage/getKey';
import checkChecksum from './utils/checkChecksum';
import TwoFasWebSocket from '@/partials/WebSocket';
import { ENCRYPTION_KEYS } from '@/constants';

/** 
* Processes the vault data.
* @param {Object} json - The JSON object containing the vault data.
* @param {string} checksum - The checksum to validate the data.
* @param {Array<string>} chunksData - The chunks of data to process.
* @param {CryptoKey} encryptionDataKeyAES - The AES encryption key for the data.
* @param {ArrayBuffer} hkdfSaltAB - The salt for HKDF.
* @param {CryptoKey} sessionKeyForHKDF - The session key for HKDF.
* @param {string} deviceId - The ID of the device.
* @return {Promise<void>}
*/
const processVaultData = async (json, checksum, chunksData, encryptionDataKeyAES, hkdfSaltAB, sessionKeyForHKDF, deviceId) => {
  let encGzipVaultData, internalChecksumAB, encryptionPassKeyAES_B64;

  try {
    encGzipVaultData = chunksData.join('');
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.joinEncGzipVaultData, { event: e });
  }

  try {
    internalChecksumAB = await crypto.subtle.digest('SHA-256', Base64ToArrayBuffer(encGzipVaultData));
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.calculateChecksum, { event: e });
  }

  checkChecksum(ArrayBufferToBase64(internalChecksumAB), checksum);

  const encGzipVaultDataBytes = DecryptBytes(Base64ToArrayBuffer(encGzipVaultData));
  const encryptionPassKeyAES = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_T3.crypto, sessionKeyForHKDF, true);

  try {
    const encryptionPassKeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionPassKeyAES);
    encryptionPassKeyAES_B64 = ArrayBufferToBase64(encryptionPassKeyAESRaw);
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.exportEncryptionPassKey, { event: e });
  }

  const itemKey = await getKey(ENCRYPTION_KEYS.ITEM_T3.sK, { deviceId });
  await storage.setItem(`session:${itemKey}`, encryptionPassKeyAES_B64);

  try {
    const vaultDataDec_AB = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: encGzipVaultDataBytes.iv }, encryptionDataKeyAES, encGzipVaultDataBytes.data);
    const vaultDataDec = ArrayBufferToString(vaultDataDec_AB);
    const vaultDataDecJSON = JSON.parse(vaultDataDec);

    if (!vaultDataDecJSON || !vaultDataDecJSON.logins) {
      throw new Error('Invalid vault data format');
    }

    // @TODO: Items! Not saveServices!
    await saveServices(vaultDataDecJSON.logins, deviceId);
    await saveTags(vaultDataDecJSON.tags, deviceId);
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.decryptVaultData, { event: e });
  }

  const socket = TwoFasWebSocket.getInstance();

  await socket.sendMessage({
    id: json.id,
    action: SOCKET_ACTIONS.TRANSFER_COMPLETED
  });
};

export default processVaultData;
