// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import handleHelloAction from '../handleHelloAction';
import handleChallengeAction from '../handleChallengeAction';
import handleCloseSignalAction from '../handleCloseSignalAction';
import handleInitTransfer from '../handleInitTransfer';
import handleSendVaultData from '../handleSendVaultData';
import processVaultsData from '../processVaultsData';
import getLoaderProgress from '@/partials/functions/getLoaderProgress';
import handlePullRequest from '../handlePullRequest';
import handlePullRequestAction from '../handlePullRequestAction';
import TwoFasWebSocket from '..';
import { SOCKET_PATHS, CONNECT_VIEWS } from '@/constants';
import { wsState } from '../wsState.js';
import wsNotify from '../wsNotify.js';

const bgConnectOnMessage = async (json, data) => {
  try {
    switch (json.action) {
      case SOCKET_ACTIONS.CLOSE_WITH_ERROR: {
        throw new TwoFasError(TwoFasError.errors.closeWithErrorReceived);
      }

      case SOCKET_ACTIONS.HELLO: {
        if (data.path === SOCKET_PATHS.CONNECT.QR) {
          wsState.connectView = CONNECT_VIEWS.Progress;
          wsState.progress = getLoaderProgress(10);
          wsNotify('stateChange', { connectView: wsState.connectView, progress: wsState.progress });
        }

        wsState.deviceName = json?.payload?.deviceName || null;
        wsNotify('stateChange', { deviceName: wsState.deviceName });

        data.deviceId = await handleHelloAction(json, data.uuid);
        wsState.progress = getLoaderProgress(25);
        wsNotify('stateChange', { progress: wsState.progress });

        break;
      }

      case SOCKET_ACTIONS.CHALLENGE: {
        const res = await handleChallengeAction(json, data.uuid);
        data.hkdfSalt = res.hkdfSalt;
        data.PK_EPHE_MA_ECDH = res.pkEpheMa;
        data.sessionKeyForHKDF = res.sessionKeyForHKDF;

        if (data.path === SOCKET_PATHS.CONNECT.QR) {
          wsState.progress = getLoaderProgress(40);
          wsNotify('stateChange', { progress: wsState.progress });
        }

        break;
      }

      case SOCKET_ACTIONS.PULL_REQUEST: {
        const res = await handlePullRequest(json, data.hkdfSalt, data.sessionKeyForHKDF, data);
        data.newSessionId = res.newSessionId;
        data.encryptionDataKeyAES = res.encryptionDataKeyAES;
        break;
      }

      case SOCKET_ACTIONS.PULL_REQUEST_ACTION: {
        const closeData = await handlePullRequestAction(json, data.hkdfSalt, data.sessionKeyForHKDF, data.encryptionDataKeyAES, data);
        data.closeData = closeData;

        if (data.path === SOCKET_PATHS.CONNECT.PUSH && !closeData?.returnUrl) {
          wsState.connectView = CONNECT_VIEWS.Progress;
          wsState.progress = getLoaderProgress(20);
          wsNotify('stateChange', { connectView: wsState.connectView, progress: wsState.progress });
        }

        break;
      }

      case SOCKET_ACTIONS.INIT_TRANSFER: {
        const res = await handleInitTransfer(json, data.hkdfSalt, data.sessionKeyForHKDF, data.uuid, data.deviceId);

        data.newSessionId = res.newSessionId;
        data.encryptionDataKeyAES = res.encryptionDataKey;
        data.sha256GzipVaultDataEnc = res.sha256GzipVaultDataEnc;

        data.totalChunks = res.totalChunks;
        data.chunks = new Array(res.totalChunks);

        if (data.path === SOCKET_PATHS.CONNECT.QR) {
          wsState.progress = getLoaderProgress(60);
        } else if (data.path === SOCKET_PATHS.CONNECT.PUSH) {
          wsState.progress = getLoaderProgress(40);
        }

        wsNotify('stateChange', { progress: wsState.progress });

        break;
      }

      case SOCKET_ACTIONS.TRANSFER_CHUNK: {
        const res = await handleSendVaultData(json, data.totalChunks);

        if (!data.chunks) {
          data.chunks = [];
        }

        data.chunks[res.chunkIndex] = res.chunkData;
        const arrayWithoutUndefined = data.chunks.filter(chunk => chunk !== undefined);

        if (data.path === SOCKET_PATHS.CONNECT.QR) {
          wsState.progress = getLoaderProgress(60 + (arrayWithoutUndefined.length / data.totalChunks) * 30);
        } else if (data.path === SOCKET_PATHS.CONNECT.PUSH) {
          wsState.progress = getLoaderProgress(40 + (arrayWithoutUndefined.length / data.totalChunks) * 50);
        }

        wsNotify('stateChange', { progress: wsState.progress });

        if (arrayWithoutUndefined.length === data.totalChunks) {
          await processVaultsData(json, data.sha256GzipVaultDataEnc, data.chunks, data.encryptionDataKeyAES, data.hkdfSalt, data.sessionKeyForHKDF, data.deviceId);
          wsState.progress = getLoaderProgress(100);
          wsNotify('stateChange', { progress: wsState.progress });
        }

        break;
      }

      case SOCKET_ACTIONS.CLOSE_WITH_SUCCESS: {
        await handleCloseSignalAction(data.newSessionId, data.uuid, data.closeData);
        break;
      }

      default: {
        throw new TwoFasError(TwoFasError.errors.unknownAction, { event: json });
      }
    }
  } catch (e) {
    await CatchError(e, async errObj => {
      wsNotify('toast', { message: errObj?.visibleErrorMessage || getMessage('error_general'), type: 'error', toastId: 'connect-error' });
      wsState.progress = 264;
      wsNotify('stateChange', { progress: 264 });

      if (data?.path === SOCKET_PATHS.CONNECT.QR) {
        wsState.socketError = true;
        wsState.connectView = CONNECT_VIEWS.QrView;
        wsNotify('stateChange', { socketError: true, connectView: CONNECT_VIEWS.QrView });
      } else if (data?.path === SOCKET_PATHS.CONNECT.PUSH) {
        wsState.connectView = CONNECT_VIEWS.DeviceSelect;
        wsNotify('stateChange', { connectView: CONNECT_VIEWS.DeviceSelect });
      }

      try {
        const socket = TwoFasWebSocket.getInstance();

        if (errObj?.code !== TwoFasError.errors.closeWithErrorReceived.code) {
          await socket.sendError({
            errorCode: errObj?.code,
            errorMessage: errObj?.message,
            id: json?.id
          });
        }

        socket.close(WEBSOCKET_STATES.INTERNAL_ERROR, 'Message processing error');
      } catch {}
    });
  }
};

export default bgConnectOnMessage;
