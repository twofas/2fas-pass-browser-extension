// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import checkStorageSessionCapacity from '../../utils/checkStorageSessionCapacity';
import checkChecksumLength from '../../utils/checkChecksumLength';
import generateEncryptionAESKey from '../../utils/generateEncryptionAESKey';
import { ENCRYPTION_KEYS } from '@/constants';
import TwoFasWebSocket from '@/partials/WebSocket';

const fullSyncAccept = async (data, state, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  const { totalChunks, totalSize, sha256GzipVaultDataEnc } = data;

  checkChecksumLength(sha256GzipVaultDataEnc);
  await checkStorageSessionCapacity(totalSize);

  const encryptionDataKeyAES = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.DATA.crypto, sessionKeyForHKDF, false);

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
