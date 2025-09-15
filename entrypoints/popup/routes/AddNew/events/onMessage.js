// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to handle messages sent to the Add New view in the popup.
* @param {Object} request - The request object containing the message data.
* @param {Object} sender - The sender object containing information about the message sender.
* @param {Function} sendResponse - The function to call with the response data.
* @param {Function} setUrl - The function to call to set the URL.
* @param {Function} updateData - The function to call to update popupState data.
* @return {boolean} True if the message was handled, false otherwise.
*/
const onMessage = (request, sender, sendResponse, setUrl, updateData) => {
  try {
    if (!request || !request?.action || request?.target !== REQUEST_TARGETS.POPUP_ADD_NEW) {
      return false;
    }
  
    switch (request.action) {
      case REQUEST_ACTIONS.SEND_URL: {
        setUrl(request.url);

        if (updateData) {
          updateData({ url: request.url });
        }
        
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
