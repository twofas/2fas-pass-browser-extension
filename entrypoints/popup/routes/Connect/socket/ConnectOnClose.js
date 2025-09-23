// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import eventBus from '@/utils/EventBus';

/** 
* Function to handle the Connect close event.
* @param {Object} event - The WebSocket close event.
* @param {Object} data - The data object containing relevant information.
* @param {Object} actions - The actions object containing functions to update the UI state.
* @return {Promise<void>} A promise that resolves when the close event has been processed.
*/
const ConnectOnClose = async (event, data, actions) => {
  actions.wsDeactivate();
  eventBus.emit(eventBus.EVENTS.CONNECT.CONNECTING, false);

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
        eventBus.emit(eventBus.EVENTS.CONNECT.CONNECTING, false);
        eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
        eventBus.emit(eventBus.EVENTS.CONNECT.HEADER_TEXT, browser.i18n.getMessage('error_general'));
      }

      break;
    }

    case WEBSOCKET_STATES.TOO_MANY_CONNECTED_CLIENTS:
    case WEBSOCKET_STATES.CANT_CREATE_PROXY:
    case WEBSOCKET_STATES.CONNECTION_ALREADY_ESTABLISHED:
    case WEBSOCKET_STATES.BROWSER_EXTENSION_NOT_CONNECTED: {
      eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
      eventBus.emit(eventBus.EVENTS.CONNECT.HEADER_TEXT, browser.i18n.getMessage('error_general'));
      break;
    }

    case WEBSOCKET_STATES.CONNECTION_TIMEOUT: {
      eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
      eventBus.emit(eventBus.EVENTS.CONNECT.HEADER_TEXT, browser.i18n.getMessage('error_timeout'));
      break;
    }

    case WEBSOCKET_STATES.MOBILE_DISCONNECTED: {
      eventBus.emit(eventBus.EVENTS.CONNECT.SOCKET_ERROR, true);
      eventBus.emit(eventBus.EVENTS.CONNECT.HEADER_TEXT, browser.i18n.getMessage('error_mobile_disconnected'));
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
