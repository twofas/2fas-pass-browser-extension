// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import TwoFasWebSocket from '@/partials/WebSocket';

/** 
* Handles the sending of vault data chunks.
* @param {Object} json - The JSON object containing the vault data.
* @param {number} totalChunks - The total number of chunks to be sent.
* @return {Promise<Object>} The response object containing the chunk index and data.
*/
const handleSendVaultData = async (json, totalChunks) => {
  try {
    const { chunkIndex, chunkData } = json.payload;
  
    if (chunkIndex < totalChunks - 1) {
      const socket = TwoFasWebSocket.getInstance();
      await socket.sendMessage({
        id: json.id,
        action: SOCKET_ACTIONS.TRANSFER_CHUNK_CONFIRMED,
        payload: {
          chunkIndex
        }
      });
    }
  
    return {
      chunkIndex,
      chunkData
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.handleSendVaultData, { event: e });
  }
};

export default handleSendVaultData;
