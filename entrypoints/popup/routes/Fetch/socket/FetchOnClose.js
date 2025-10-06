// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import deletePush from '@/partials/functions/deletePush';
import { FETCH_STATE } from '../constants';

/**
* Function to handle Fetch closure events.
* @param {Object} event - The WebSocket event data.
* @param {Object} data - The current state data.
* @return {Promise<void>} A promise that resolves when the closure is handled.
*/
const FetchOnClose = async (event, data) => {
  if (data?.state?.data?.itemId && data?.state?.data?.notificationId) {
    await deletePush(data.state.data.deviceId, data.state.data.notificationId);
  }

  switch (event.code) {
    case WEBSOCKET_STATES.TOO_MANY_CONNECTED_CLIENTS:
    case WEBSOCKET_STATES.CANT_CREATE_PROXY:
    case WEBSOCKET_STATES.CONNECTION_ALREADY_ESTABLISHED:
    case WEBSOCKET_STATES.BROWSER_EXTENSION_NOT_CONNECTED: {
      eventBus.emit(eventBus.EVENTS.FETCH.SET_FETCH_STATE, FETCH_STATE.CONNECTION_ERROR);
      eventBus.emit(eventBus.EVENTS.FETCH.ERROR_TEXT, browser.i18n.getMessage('fetch_connection_error_header'));
      break;
    }

    case WEBSOCKET_STATES.CONNECTION_TIMEOUT: {
      eventBus.emit(eventBus.EVENTS.FETCH.SET_FETCH_STATE, FETCH_STATE.CONNECTION_TIMEOUT);
      break;
    }

    case WEBSOCKET_STATES.MOBILE_DISCONNECTED: {
      eventBus.emit(eventBus.EVENTS.FETCH.SET_FETCH_STATE, FETCH_STATE.CONNECTION_ERROR);
      eventBus.emit(eventBus.EVENTS.FETCH.ERROR_TEXT, browser.i18n.getMessage('error_mobile_disconnected'));
      break;
    }

    case WEBSOCKET_STATES.NORMAL_CLOSURE:
    default: {
      break;
    }
  }
};

export default FetchOnClose;
