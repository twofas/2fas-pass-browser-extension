// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import { SOCKET_PATHS, CONNECT_VIEWS } from '@/constants';

/** 
* Function to handle the Connect close event.
* @param {Object} event - The WebSocket close event.
* @return {Promise<void>} A promise that resolves when the close event has been processed.
*/
const ConnectOnClose = async (event, data) => {
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
          eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
        }

        eventBus.emit(eventBus.EVENTS.CONNECT.SHOW_TOAST, { message: browser.i18n.getMessage('error_general'), type: 'error' });
      }

      break;
    }

    case WEBSOCKET_STATES.TOO_MANY_CONNECTED_CLIENTS:
    case WEBSOCKET_STATES.CANT_CREATE_PROXY:
    case WEBSOCKET_STATES.CONNECTION_ALREADY_ESTABLISHED:
    case WEBSOCKET_STATES.BROWSER_EXTENSION_NOT_CONNECTED:
    case WEBSOCKET_STATES.INVALID_MESSAGE_ERROR: {
      if (data?.path === SOCKET_PATHS.CONNECT.QR) {
        eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
      }

      eventBus.emit(eventBus.EVENTS.CONNECT.SHOW_TOAST, { message: browser.i18n.getMessage('error_general'), type: 'error' });
      break;
    }

    case WEBSOCKET_STATES.INVALID_SCHEME: {
      if (data?.path === SOCKET_PATHS.CONNECT.QR) {
        eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
      }

      eventBus.emit(eventBus.EVENTS.CONNECT.SHOW_TOAST, { message: browser.i18n.getMessage('error_scheme_mismatch'), type: 'error' });
      break;
    }

    case WEBSOCKET_STATES.CONNECTION_TIMEOUT: {
      if (data?.path === SOCKET_PATHS.CONNECT.QR) {
        eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
      }

      eventBus.emit(eventBus.EVENTS.CONNECT.SHOW_TOAST, { message: browser.i18n.getMessage('error_timeout'), type: 'error' });
      break;
    }

    case WEBSOCKET_STATES.MOBILE_DISCONNECTED: {
      if (data?.path === SOCKET_PATHS.CONNECT.QR) {
        eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
        eventBus.emit(eventBus.EVENTS.CONNECT.CHANGE_VIEW, CONNECT_VIEWS.QrView);
      } else {
        eventBus.emit(eventBus.EVENTS.CONNECT.CHANGE_VIEW, CONNECT_VIEWS.DeviceSelect);
      }

      eventBus.emit(eventBus.EVENTS.CONNECT.SHOW_TOAST, { message: browser.i18n.getMessage('error_mobile_disconnected'), type: 'error' });
      break;
    }

    case WEBSOCKET_STATES.INTERNAL_ERROR: {
      // Do nothing, error is already handled
      break;
    }

    case WEBSOCKET_STATES.NORMAL_CLOSURE:
    default: {
      eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, false);
      break;
    }
  }
};

export default ConnectOnClose;
