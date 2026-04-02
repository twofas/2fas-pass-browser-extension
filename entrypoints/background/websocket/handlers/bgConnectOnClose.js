// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import { SOCKET_PATHS, CONNECT_VIEWS } from '@/constants';
import { networkTest } from '@/partials/functions';
import { wsState } from '../wsState.js';
import wsNotify from '../wsNotify.js';

const bgConnectOnClose = async (event, data) => {
  if (wsState._socketData?.uuid !== data?.uuid) {
    return;
  }

  switch (event.code) {
    case 1000: {
      let connected = false;

      for (let i = 0; i < 10; i++) {
        const configured = await getConfiguredBoolean();

        if (configured) {
          connected = true;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!connected) {
        if (data?.path === SOCKET_PATHS.CONNECT.QR) {
          wsState.socketError = true;
          wsNotify('stateChange', { socketError: true });
        }

        wsNotify('toast', { message: getMessage('error_general'), type: 'error', toastId: 'connect-error' });
      }

      break;
    }

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

      const toastMessage = await networkTest('error_general');

      if (data?.path === SOCKET_PATHS.CONNECT.QR) {
        wsState.socketError = true;
        wsNotify('stateChange', { socketError: true });
      }

      wsNotify('toast', { message: getMessage(toastMessage), type: 'error', toastId: 'connect-error' });
      break;
    }

    case WEBSOCKET_STATES.INVALID_SCHEME: {
      if (data?.path === SOCKET_PATHS.CONNECT.QR) {
        wsState.socketError = true;
        wsNotify('stateChange', { socketError: true });
      }

      wsNotify('toast', { message: getMessage('error_scheme_mismatch'), type: 'error', toastId: 'connect-error' });
      break;
    }

    case WEBSOCKET_STATES.CONNECTION_TIMEOUT: {
      if (data?.path === SOCKET_PATHS.CONNECT.QR) {
        wsState.socketError = true;
        wsNotify('stateChange', { socketError: true });
      } else if (data?.path === SOCKET_PATHS.CONNECT.PUSH) {
        wsState.connectView = CONNECT_VIEWS.DeviceSelect;
        wsNotify('stateChange', { connectView: CONNECT_VIEWS.DeviceSelect });
      }

      wsNotify('toast', { message: getMessage('error_timeout'), type: 'error', toastId: 'connect-error' });
      break;
    }

    case WEBSOCKET_STATES.MOBILE_DISCONNECTED: {
      if (data?.path === SOCKET_PATHS.CONNECT.QR) {
        wsState.socketError = true;
        wsState.connectView = CONNECT_VIEWS.QrView;
        wsNotify('stateChange', { socketError: true, connectView: CONNECT_VIEWS.QrView });
      } else {
        wsState.connectView = CONNECT_VIEWS.DeviceSelect;
        wsNotify('stateChange', { connectView: CONNECT_VIEWS.DeviceSelect });
      }

      wsNotify('toast', { message: getMessage('error_mobile_disconnected'), type: 'error', toastId: 'connect-error' });
      break;
    }

    case WEBSOCKET_STATES.INTERNAL_ERROR: {
      break;
    }

    case WEBSOCKET_STATES.NORMAL_CLOSURE:
    default: {
      wsState.socketError = false;
      wsNotify('stateChange', { socketError: false });
      break;
    }
  }

  wsState.active = false;
  wsNotify('stateChange', { active: false, connectView: null });
};

export default bgConnectOnClose;
