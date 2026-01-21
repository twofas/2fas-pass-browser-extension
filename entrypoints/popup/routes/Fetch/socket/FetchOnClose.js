// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import deletePush from '@/partials/functions/deletePush';
import networkTest from '@/partials/functions/networkTest';
import { FETCH_STATE } from '../constants';

/**
* Function to handle Fetch closure events.
* @param {Object} event - The WebSocket event data.
* @param {Object} data - The current state data.
* @return {Promise<void>} A promise that resolves when the closure is handled.
*/
const FetchOnClose = async (event, data) => {
  eventBus.emit(eventBus.EVENTS.FETCH.DISCONNECT, true);

  if (data?.state?.data?.itemId && data?.state?.data?.notificationId) {
    await deletePush(data.state.data.deviceId, data.state.data.notificationId);
  }

  switch (event.code) {
    case 1001: // Going Away
    case 1002: // Protocol error
    case 1003: // Unsupported Data
    case 1005: // No Status Received
    case 1006: // Abnormal Closure
    case 1007: // Invalid frame payload data
    case 1008: // Policy Violation
    case 1009: // Message Too Big
    case 1010: // Mandatory Extension
    case 1011: // Internal Error
    case 1012: // Service Restart
    case 1013: // Try Again Later
    case 1014: // Bad Gateway
    case 1015: // TLS Handshake
    case WEBSOCKET_STATES.TOO_MANY_CONNECTED_CLIENTS:
    case WEBSOCKET_STATES.CANT_CREATE_PROXY:
    case WEBSOCKET_STATES.CONNECTION_ALREADY_ESTABLISHED:
    case WEBSOCKET_STATES.BROWSER_EXTENSION_NOT_CONNECTED:
    case WEBSOCKET_STATES.INVALID_MESSAGE_ERROR: {
      if (event.code === 1005 && event.wasClean === true) {
        return false;
      }

      const toastMessage = await networkTest('fetch_connection_error_header');

      eventBus.emit(eventBus.EVENTS.FETCH.SET_FETCH_STATE, FETCH_STATE.CONNECTION_ERROR);
      eventBus.emit(eventBus.EVENTS.FETCH.ERROR_TEXT, getMessage(toastMessage));
      break;
    }

    case WEBSOCKET_STATES.CONNECTION_TIMEOUT: {
      eventBus.emit(eventBus.EVENTS.FETCH.SET_FETCH_STATE, FETCH_STATE.CONNECTION_TIMEOUT);
      break;
    }

    case WEBSOCKET_STATES.MOBILE_DISCONNECTED: {
      eventBus.emit(eventBus.EVENTS.FETCH.SET_FETCH_STATE, FETCH_STATE.CONNECTION_ERROR);
      eventBus.emit(eventBus.EVENTS.FETCH.ERROR_TEXT, getMessage('error_mobile_disconnected'));
      break;
    }

    case WEBSOCKET_STATES.NORMAL_CLOSURE:
    default: {
      break;
    }
  }
};

export default FetchOnClose;
