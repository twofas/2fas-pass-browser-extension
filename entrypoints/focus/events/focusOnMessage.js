// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import autoClearAction from '@/partials/functions/autoClearAction';

/** 
* Function to handle messages in the prompt context.
* @param {Object} request - The request object.
* @param {Object} sender - The sender object.
* @param {Function} sendResponse - The function to send the response.
* @return {Promise<void>} 
*/
const focusOnMessage = (request, sender, sendResponse, focusFuncAction) => {
  try {
    if (!request || !request?.action || request?.target !== REQUEST_TARGETS.FOCUS_CONTENT) {
      return false;
    }
    
    switch (request.action) {
      case REQUEST_ACTIONS.AUTO_CLEAR_ACTION: {
        if (import.meta.env.BROWSER !== 'safari') {
          autoClearAction(request).finally(sendResponse);
        } else {
          sendResponse({ status: 'ok' });
        }

        break;
      }

      case REQUEST_ACTIONS.FOCUS_CHECK: {
        focusFuncAction().finally(() => sendResponse({ status: 'ok' }));
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

export default focusOnMessage;
