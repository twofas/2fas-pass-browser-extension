// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import handleFetchHelloAction from '@/partials/WebSocket/handleFetchHelloAction';
import handleChallengeAction from '@/partials/WebSocket/handleChallengeAction';
import handleCloseSignalPullRequestAction from '@/partials/WebSocket/handleCloseSignalPullRequestAction';
import handlePullRequest from '@/partials/WebSocket/handlePullRequest';
import handlePullRequestAction from '@/partials/WebSocket/handlePullRequestAction';
import deletePush from '@/partials/functions/deletePush';
import TwoFasWebSocket from '@/partials/WebSocket';

/**
* Function to handle incoming Fetch messages.
* @param {Object} json - The incoming message data.
* @param {Object} data - The current state data.
* @param {Object} actions - The actions to perform.
* @return {Promise<void>} A promise that resolves when the message is handled.
*/
const FetchOnMessage = async (json, data, actions) => {
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
  
      case SOCKET_ACTIONS.CLOSE_WITH_SUCCESS: {
        await handleCloseSignalPullRequestAction(data.newSessionId, data.device.uuid, data.closeData, actions.navigate);
        break;
      }
  
      default: {
        throw new TwoFasError(TwoFasError.errors.unknownAction, { event: json });
      }
    }
  } catch (e) {
    await CatchError(e, async errObj => {
      actions.wsDeactivate();
      actions.setFetchState(1);
      // FUTURE - Base on error code
      actions.setErrorText(errObj?.additional?.errorMessage || browser.i18n.getMessage('error_general'));

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
