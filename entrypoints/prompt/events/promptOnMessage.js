// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to handle messages in the prompt context.
* @param {Object} request - The request object.
* @param {Object} sender - The sender object.
* @param {Function} sendResponse - The function to send the response.
* @param {Object} timers - An object containing timers to be cleared.
* @param {Object} ignore - A flag to indicate whether to ignore the prompt.
* @return {Promise<void>} 
*/
const promptOnMessage = (request, sender, sendResponse, timers, ignore) => {
  try {
    if (!request || !request?.action || request?.target !== REQUEST_TARGETS.PROMPT) {
      return false;
    }

    switch (request.action) {
      case REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK: {
        sendResponse({ status: 'ok' });
        break;
      }

      case REQUEST_ACTIONS.IGNORE_SAVE_PROMPT: {
        Object.values(timers).forEach(timer => clearTimeout(timer));

        timers = {};
        ignore.value = true;

        setTimeout(() => { ignore.value = false; }, 300);
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

export default promptOnMessage;
