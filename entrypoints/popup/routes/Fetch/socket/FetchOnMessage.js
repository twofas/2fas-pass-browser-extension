// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import handleFetchHelloAction from '@/entrypoints/background/websocket/handleFetchHelloAction';
import handleChallengeAction from '@/entrypoints/background/websocket/handleChallengeAction';
import handleCloseSignalPullRequestAction from '@/entrypoints/background/websocket/handleCloseSignalPullRequestAction';
import handlePullRequest from '@/entrypoints/background/websocket/handlePullRequest';
import handlePullRequestAction from '@/entrypoints/background/websocket/handlePullRequestAction';
import handleSendVaultData from '@/entrypoints/background/websocket/handleSendVaultData';
import processFullSyncVaultsData from '@/entrypoints/background/websocket/processFullSyncVaultsData';
import deletePush from '@/partials/functions/deletePush';
import TwoFasWebSocket from '@/entrypoints/background/websocket';
import { FETCH_STATE } from '../constants';

/**
* Function to handle incoming Fetch messages.
* @param {Object} json - The incoming message data.
* @param {Object} data - The current state data.
* @return {Promise<void>} A promise that resolves when the message is handled.
*/
const FetchOnMessage = async (json, data) => {
  try {
    switch (json.action) {
      case SOCKET_ACTIONS.CLOSE_WITH_ERROR: {
        if (data?.state?.deviceId && data?.state?.notificationId) {
          await deletePush(data.state.deviceId, data.state.notificationId);
        }
        
        throw new TwoFasError(TwoFasError.errors.closeWithErrorReceived, { additional: json.payload });
      }
  
      case SOCKET_ACTIONS.HELLO: {
        data.deviceId = await handleFetchHelloAction(json, data.state.deviceId, data.device.id);
        break;
      }
  
      case SOCKET_ACTIONS.CHALLENGE: {
        const res = await handleChallengeAction(json, data.device.uuid);
        data.hkdfSalt = res.hkdfSalt;
        data.PK_EPHE_MA_ECDH = res.pkEpheMa;
        data.sessionKeyForHKDF = res.sessionKeyForHKDF;
        break;
      }

      case SOCKET_ACTIONS.PULL_REQUEST: {
        const res = await handlePullRequest(json, data.hkdfSalt, data.sessionKeyForHKDF, data.state);
        data.newSessionId = res.newSessionId;
        data.encryptionDataKeyAES = res.encryptionDataKeyAES;
        break;
      }

      case SOCKET_ACTIONS.PULL_REQUEST_ACTION: {
        const closeData = await handlePullRequestAction(json, data.hkdfSalt, data.sessionKeyForHKDF, data.encryptionDataKeyAES, data.state);
        data.closeData = closeData;
        break;
      }

      case SOCKET_ACTIONS.TRANSFER_CHUNK: {
        const res = await handleSendVaultData(json, data.state.totalChunks);

        data.state.chunks[res.chunkIndex] = res.chunkData;
        const arrayWithoutUndefined = data.state.chunks.filter(chunk => chunk !== undefined);

        if (arrayWithoutUndefined.length === data.state.totalChunks) {
          data.closeData = await processFullSyncVaultsData(
            data.state.sha256GzipVaultDataEnc,
            data.state.chunks,
            data.encryptionDataKeyAES,
            data.hkdfSalt,
            data.sessionKeyForHKDF,
            data.deviceId,
            json.id
          );
        }

        break;
      }
  
      case SOCKET_ACTIONS.CLOSE_WITH_SUCCESS: {
        await handleCloseSignalPullRequestAction(data.newSessionId, data.device.uuid, data.closeData, data.state);
        break;
      }
  
      default: {
        throw new TwoFasError(TwoFasError.errors.unknownAction, { event: json });
      }
    }
  } catch (e) {
    await CatchError(e, async errObj => {
      eventBus.emit(eventBus.EVENTS.FETCH.SET_FETCH_STATE, FETCH_STATE.CONNECTION_ERROR);
      eventBus.emit(eventBus.EVENTS.FETCH.ERROR_TEXT, errObj?.additional?.errorMessage || getMessage('error_general')); // FUTURE - Base on error code

      if (data?.state?.deviceId && data?.state?.notificationId) {
        await deletePush(data.state.deviceId, data.state.notificationId);
      }

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

export default FetchOnMessage;
