// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateEncryptionAESKey from './utils/generateEncryptionAESKey';
import saveVaults from './utils/saveVaults';
import decompress from '../gzip/decompress';
import getKey from '@/partials/sessionStorage/getKey';
import checkChecksum from './utils/checkChecksum';
import getItemsKeys from '../sessionStorage/getItemsKeys';
import TwoFasWebSocket from '@/partials/WebSocket';
import { ENCRYPTION_KEYS } from '@/constants';

/** 
* Processes the vault data.
* @param {string} checksum - The checksum to validate the data.
* @param {Array<string>} chunksData - The chunks of data to process.
* @param {CryptoKey} encryptionDataKeyAES - The AES encryption key for the data.
* @param {ArrayBuffer} hkdfSaltAB - The salt for HKDF.
* @param {CryptoKey} sessionKeyForHKDF - The session key for HKDF.
* @param {string} deviceId - The ID of the device.
* @param {string} messageId - The message ID for the WebSocket communication.
* @return {Promise<void>}
*/
const processFullSyncVaultsData = async (checksum, chunksData, encryptionDataKeyAES, hkdfSaltAB, sessionKeyForHKDF, deviceId, messageId) => {
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

  const encryptionT3Key = await getKey(ENCRYPTION_KEYS.ITEM_T3.sK, { deviceId });

  try {
    const vaultDataDecGZIP_AB = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: encGzipVaultDataBytes.iv }, encryptionDataKeyAES, encGzipVaultDataBytes.data);
    const vaultDataDec = await decompress(vaultDataDecGZIP_AB);
    const vaultDataDecJSON = JSON.parse(vaultDataDec);

    if (!vaultDataDecJSON || !Array.isArray(vaultDataDecJSON)) {
      throw new Error('Invalid vault data format');
    }

    // Remove any existing encryption keys @TODO:

    // Remove any existing session storage items
    const devices = await storage.getItem('local:devices');
    const device = devices.find(d => d.id === deviceId);
    const vaults = device?.vaults || [];
    const vaultIds = vaults.map(v => v.id);

    for (const vaultId of vaultIds) {
      const existingItemsKeys = await getItemsKeys(vaultId, deviceId);
      await storage.removeItems(existingItemsKeys);
    }

    // Remove any existing alarms
    await browser.alarms.clearAll(); // @TODO: Safari!

    // Remove any existing context menu items
    await browser.contextMenus.removeAll();

    await storage.setItem(`session:${encryptionT3Key}`, encryptionPassKeyAES_B64);
    await saveVaults(vaultDataDecJSON, deviceId);
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.decryptVaultData, { event: e });
  }

  const socket = TwoFasWebSocket.getInstance();

  await socket.sendMessage({
    id: messageId,
    action: SOCKET_ACTIONS.TRANSFER_COMPLETED
  });

  return {
    returnUrl: '/',
    returnToast: {
      text: browser.i18n.getMessage('fetch_full_sync_completed_toast'),
      type: 'success'
    }
  };
};

export default processFullSyncVaultsData;
