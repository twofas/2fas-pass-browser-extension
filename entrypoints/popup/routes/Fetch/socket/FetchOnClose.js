// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import deletePush from '@/partials/functions/deletePush';

/**
* Function to handle Fetch closure events.
* @param {Object} event - The WebSocket event data.
* @param {Object} data - The current state data.
* @param {Object} actions - The actions to perform.
* @return {Promise<void>} A promise that resolves when the closure is handled.
*/
const FetchOnClose = async (event, data, actions) => {
  actions.wsDeactivate();

  if (data?.state?.data?.loginId && data?.state?.data?.notificationId) {
    await deletePush(data.state.data.deviceId, data.state.data.notificationId);
  }

  switch (event.code) {
    case WEBSOCKET_STATES.TOO_MANY_CONNECTED_CLIENTS:
    case WEBSOCKET_STATES.CANT_CREATE_PROXY:
    case WEBSOCKET_STATES.CONNECTION_ALREADY_ESTABLISHED:
    case WEBSOCKET_STATES.BROWSER_EXTENSION_NOT_CONNECTED: {
      actions.setFetchState(1);
      actions.setErrorText(browser.i18n.getMessage('fetch_connection_error_header'));
      break;
    }

    case WEBSOCKET_STATES.CONNECTION_TIMEOUT: {
      actions.setFetchState(2);
      break;
    }

    case WEBSOCKET_STATES.MOBILE_DISCONNECTED: {
      actions.setFetchState(1);
      actions.setErrorText(browser.i18n.getMessage('error_mobile_disconnected'));
      break;
    }

    case WEBSOCKET_STATES.NORMAL_CLOSURE:
    default: {
      break;
    }
  }
};

export default FetchOnClose;
