// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { startConnectQR, startConnectPush, startFetch, cancelCurrentAction, reloadConnectQR, getPublicState } from '../websocket/wsManager.js';
import { consumePendingUpdates } from '../websocket/wsState.js';

const onWsMessage = (request, sender, sendResponse) => {
  try {
    if (!request || !request.action || request.target !== REQUEST_TARGETS.BACKGROUND_WS) {
      return false;
    }

    switch (request.action) {
      case REQUEST_ACTIONS.WS_CONNECT_QR: {
        startConnectQR()
          .then(result => { sendResponse(result); })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });

        break;
      }

      case REQUEST_ACTIONS.WS_CONNECT_PUSH: {
        startConnectPush(request.deviceId)
          .then(result => { sendResponse(result); })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });

        break;
      }

      case REQUEST_ACTIONS.WS_FETCH: {
        startFetch(request.fetchAction, request.fetchData, request.from)
          .then(result => { sendResponse(result); })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });

        break;
      }

      case REQUEST_ACTIONS.WS_CANCEL: {
        cancelCurrentAction()
          .then(result => { sendResponse(result); })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });

        break;
      }

      case REQUEST_ACTIONS.WS_GET_STATE: {
        const state = getPublicState();
        const pendingUpdates = consumePendingUpdates();

        sendResponse({ status: 'ok', state, pendingUpdates });
        break;
      }

      case REQUEST_ACTIONS.WS_RELOAD_QR: {
        reloadConnectQR()
          .then(result => { sendResponse(result); })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });

        break;
      }

      default: {
        sendResponse({ status: 'error', message: 'Unknown WS action' });
        break;
      }
    }
  } catch (e) {
    sendResponse({ status: 'error', message: 'Unknown error' });
    CatchError(e);
  }

  return true;
};

export default onWsMessage;
