// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { FETCH_STATE } from "@/entrypoints/popup/routes/Fetch/constants";
import { deletePush } from "../functions";
import TwoFasWebSocket from ".";

// path - connect_qr, connect_push, fetch

const SocketOnMessage = async (path, json, data) => {
  try {
    switch (json.action) {
      case SOCKET_ACTIONS.CLOSE_WITH_ERROR: {
        console.log('CLOSE_WITH_ERROR received', json);
        throw new TwoFasError(TwoFasError.errors.closeWithErrorReceived);
      }

      case SOCKET_ACTIONS.HELLO: {
        console.log('HELLO received', json);
        break;
      }

      case SOCKET_ACTIONS.CHALLENGE: {
        console.log('CHALLENGE received', json);
        break;
      }

      case SOCKET_ACTIONS.PULL_REQUEST: {
        console.log('PULL_REQUEST received', json);
        break;
      }

      case SOCKET_ACTIONS.PULL_REQUEST_ACTION: {
        console.log('PULL_REQUEST_ACTION received', json);
        break;
      }

      case SOCKET_ACTIONS.INIT_TRANSFER: {
        console.log('INIT_TRANSFER received', json);
        break;
      }

      case SOCKET_ACTIONS.TRANSFER_CHUNK: {
        console.log('TRANSFER_CHUNK received', json);
        break;
      }

      case SOCKET_ACTIONS.CLOSE_WITH_SUCCESS: {
        console.log('CLOSE_WITH_SUCCESS received', json);
        break;
      }

      default: {
        throw new TwoFasError(TwoFasError.errors.unknownAction, { event: json });
      }
    }
  } catch (e) {
    await CatchError(e, async errObj => {
      if (path === 'fetch') {
        eventBus.emit(eventBus.EVENTS.FETCH.SET_FETCH_STATE, FETCH_STATE.CONNECTION_ERROR);
        eventBus.emit(eventBus.EVENTS.FETCH.ERROR_TEXT, errObj?.additional?.errorMessage || browser.i18n.getMessage('error_general')); // FUTURE - Base on error code
      } else {
        eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
        eventBus.emit(eventBus.EVENTS.CONNECT.SHOW_ERROR, errObj?.visibleErrorMessage || browser.i18n.getMessage('error_general'));
        eventBus.emit(eventBus.EVENTS.CONNECT.CONNECTING, false);
        eventBus.emit(eventBus.EVENTS.CONNECT.LOADER, 264);
      }

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

export default SocketOnMessage;
