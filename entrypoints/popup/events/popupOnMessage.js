// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import clearClipboard from '@/partials/functions/clearClipboard';

/** 
* Function to handle messages sent to the popup.
* @param {Object} request - The request object.
* @param {Object} sender - The sender object.
* @param {Function} sendResponse - The function to send a response.
* @return {boolean} Indicates if the message was handled.
*/
const popupOnMessage = (request, sender, sendResponse) => {
  try {
    if (!request || !request.action || request.target !== REQUEST_TARGETS.POPUP) {
      return false;
    }

    switch (request.action) {
      case REQUEST_ACTIONS.AUTO_CLEAR_CLIPBOARD: {
        clearClipboard();
        sendResponse({ status: 'ok' });
        break;
      }

      default: {
        sendResponse({ status: 'error', message: 'Wrong action' });
        break;
      }
    }
  } catch (e) {
    sendResponse({ status: 'error' });
    CatchError(e);
  }

  return true;
};

export default popupOnMessage;
