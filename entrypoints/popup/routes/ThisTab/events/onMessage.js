// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Handles incoming messages in ThisTab view.
* @param {Object} request - The request object.
* @param {Object} sender - The sender object.
* @param {Function} sendResponse - The function to send a response.
* @param {Function} sendUrl - The function to send a URL.
* @return {boolean} Whether the message was handled.
*/
const onMessage = (request, sender, sendResponse, sendUrl) => {
  try {
    if (!request || !request?.action || request?.target !== REQUEST_TARGETS.POPUP_THIS_TAB) {
      return false;
    }

    switch (request.action) {
      case REQUEST_ACTIONS.SEND_URL: {
        sendUrl(request);
        sendResponse({ status: 'ok' });
        break;
      }

      default: {
        sendResponse({ status: 'error', message: 'Wrong action' });
        break;
      }
    }
  } catch (e) {
    sendResponse({ status: 'error', message: 'Unknown error' });
    CatchError(e);
  }

  return true;
};

export default onMessage;
