// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import handleFetchHelloAction from '../handleFetchHelloAction';
import handleChallengeAction from '../handleChallengeAction';
import handleCloseSignalPullRequestAction from '../handleCloseSignalPullRequestAction';
import handlePullRequest from '../handlePullRequest';
import handlePullRequestAction from '../handlePullRequestAction';
import handleSendVaultData from '../handleSendVaultData';
import processFullSyncVaultsData from '../processFullSyncVaultsData';
import deletePush from '@/partials/functions/deletePush';
import TwoFasWebSocket from '..';
import { wsState } from '../wsState.js';
import wsNotify from '../wsNotify.js';

const bgFetchOnMessage = async (json, data) => {
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
      wsState.fetchState = 1; // FETCH_STATE.CONNECTION_ERROR
      wsState.fetchErrorText = errObj?.additional?.errorMessage || getMessage('error_general');
      wsNotify('stateChange', { fetchState: wsState.fetchState, fetchErrorText: wsState.fetchErrorText });

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

export default bgFetchOnMessage;
