// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import deletePush from '@/partials/functions/deletePush';
import networkTest from '@/partials/functions/networkTest';
import { wsState } from '../wsState.js';
import wsNotify from '../wsNotify.js';

const bgFetchOnClose = async (event, data) => {
  if (data?.state?.data?.itemId && data?.state?.data?.notificationId) {
    await deletePush(data.state.data.deviceId, data.state.data.notificationId);
  }

  switch (event.code) {
    case 1001:
    case 1002:
    case 1003:
    case 1005:
    case 1006:
    case 1007:
    case 1008:
    case 1009:
    case 1010:
    case 1011:
    case 1012:
    case 1013:
    case 1014:
    case 1015:
    case WEBSOCKET_STATES.TOO_MANY_CONNECTED_CLIENTS:
    case WEBSOCKET_STATES.CANT_CREATE_PROXY:
    case WEBSOCKET_STATES.CONNECTION_ALREADY_ESTABLISHED:
    case WEBSOCKET_STATES.BROWSER_EXTENSION_NOT_CONNECTED:
    case WEBSOCKET_STATES.INVALID_MESSAGE_ERROR: {
      if (event.code === 1005 && event.wasClean === true) {
        break;
      }

      const toastMessage = await networkTest('fetch_connection_error_header');

      wsState.fetchState = 1; // FETCH_STATE.CONNECTION_ERROR
      wsState.fetchErrorText = getMessage(toastMessage);
      wsNotify('stateChange', { fetchState: wsState.fetchState, fetchErrorText: wsState.fetchErrorText });
      break;
    }

    case WEBSOCKET_STATES.CONNECTION_TIMEOUT: {
      wsState.fetchState = 2; // FETCH_STATE.CONNECTION_TIMEOUT
      wsNotify('stateChange', { fetchState: wsState.fetchState });
      break;
    }

    case WEBSOCKET_STATES.MOBILE_DISCONNECTED: {
      wsState.fetchState = 1; // FETCH_STATE.CONNECTION_ERROR
      wsState.fetchErrorText = getMessage('error_mobile_disconnected');
      wsNotify('stateChange', { fetchState: wsState.fetchState, fetchErrorText: wsState.fetchErrorText });
      break;
    }

    case WEBSOCKET_STATES.NORMAL_CLOSURE:
    default: {
      break;
    }
  }

  wsState.active = false;
  wsNotify('stateChange', { active: false });
};

export default bgFetchOnClose;
