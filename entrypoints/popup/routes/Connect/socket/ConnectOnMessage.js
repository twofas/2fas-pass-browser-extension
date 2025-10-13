// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import handleHelloAction from '@/partials/WebSocket/handleHelloAction';
import handleChallengeAction from '@/partials/WebSocket/handleChallengeAction';
import handleCloseSignalAction from '@/partials/WebSocket/handleCloseSignalAction';
import handleInitTransfer from '@/partials/WebSocket/handleInitTransfer';
import handleSendVaultData from '@/partials/WebSocket/handleSendVaultData';
import processVaultsData from '@/partials/WebSocket/processVaultsData';
import getLoaderProgress from '@/partials/functions/getLoaderProgress';
import TwoFasWebSocket from '@/partials/WebSocket';

/** 
* Function to handle incoming Connect messages.
* @async
* @param {Object} json - The JSON payload of the WebSocket message.
* @param {Object} data - The data object containing relevant information.
* @param {Object} actions - The actions object containing functions to update the UI state.
* @return {Promise<void>} A promise that resolves when the message has been processed.
*/
const ConnectOnMessage = async (json, data) => {
  try {
    switch (json.action) {
      case SOCKET_ACTIONS.CLOSE_WITH_ERROR: {
        console.log('CLOSE_WITH_ERROR received', json);
        throw new TwoFasError(TwoFasError.errors.closeWithErrorReceived);
      }
  
      case SOCKET_ACTIONS.HELLO: {
        eventBus.emit(eventBus.EVENTS.CONNECT.CONNECTING, true);
        eventBus.emit(eventBus.EVENTS.CONNECT.LOADER, getLoaderProgress(10));
        
        data.deviceId = await handleHelloAction(json, data.uuid);
        eventBus.emit(eventBus.EVENTS.CONNECT.LOADER, getLoaderProgress(25));

        break;
      }
  
      case SOCKET_ACTIONS.CHALLENGE: {
        const res = await handleChallengeAction(json, data.uuid);
        data.hkdfSalt = res.hkdfSalt;
        data.PK_EPHE_MA_ECDH = res.pkEpheMa;
        data.sessionKeyForHKDF = res.sessionKeyForHKDF;

        eventBus.emit(eventBus.EVENTS.CONNECT.LOADER, getLoaderProgress(40));

        break;
      }
  
      case SOCKET_ACTIONS.INIT_TRANSFER: {
        const res = await handleInitTransfer(json, data.hkdfSalt, data.sessionKeyForHKDF, data.uuid, data.deviceId);
        
        data.newSessionId = res.newSessionId;
        data.encryptionDataKey = res.encryptionDataKey;
        data.sha256GzipVaultDataEnc = res.sha256GzipVaultDataEnc;

        data.totalChunks = res.totalChunks;
        data.chunks = new Array(res.totalChunks);

        eventBus.emit(eventBus.EVENTS.CONNECT.LOADER, getLoaderProgress(60));

        break;
      }
  
      case SOCKET_ACTIONS.TRANSFER_CHUNK: {
        const res = await handleSendVaultData(json, data.totalChunks);
        
        data.chunks[res.chunkIndex] = res.chunkData;
        const arrayWithoutUndefined = data.chunks.filter(chunk => chunk !== undefined);
  
        eventBus.emit(eventBus.EVENTS.CONNECT.LOADER, getLoaderProgress(60 + (arrayWithoutUndefined.length / data.totalChunks) * 30));
  
        if (arrayWithoutUndefined.length === data.totalChunks) {
          await processVaultsData(json, data.sha256GzipVaultDataEnc, data.chunks, data.encryptionDataKey, data.hkdfSalt, data.sessionKeyForHKDF, data.deviceId);
          eventBus.emit(eventBus.EVENTS.CONNECT.LOADER, getLoaderProgress(100));
        }
  
        break;
      }
  
      case SOCKET_ACTIONS.CLOSE_WITH_SUCCESS: {
        await handleCloseSignalAction(data.newSessionId, data.uuid);
        break;
      }
  
      default: {
        throw new TwoFasError(TwoFasError.errors.unknownAction, { event: json });
      }
    }
  } catch (e) {
    await CatchError(e, async errObj => {
      eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
      eventBus.emit(eventBus.EVENTS.CONNECT.HEADER_TEXT, errObj?.visibleErrorMessage || browser.i18n.getMessage('error_general'));
      eventBus.emit(eventBus.EVENTS.CONNECT.CONNECTING, false);
      eventBus.emit(eventBus.EVENTS.CONNECT.LOADER, 264);

      if (errObj?.code !== TwoFasError.errors.closeWithErrorReceived.code) {
        try {
          const socket = TwoFasWebSocket.getInstance();
          await socket.sendError({
            errorCode: errObj?.code,
            errorMessage: errObj?.message,
            id: json?.id
          });
        } catch {}
      }
    });
  }
};

export default ConnectOnMessage;
