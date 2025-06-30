// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLocalKey from '../utils/getLocalKey';
import promptInput from '../utils/promptInput';

/** 
* Function to handle messages related to prompts.
* @param {Object} request - The request object containing the action and data.
* @param {Object} sender - The sender object containing information about the message sender.
* @param {Function} sendResponse - The function to send a response back to the sender.
* @return {Promise<boolean>} A promise that resolves to true if the prompt message is handled successfully, otherwise false.
*/
const onPromptMessage = (request, sender, sendResponse, tabsInputData) => {
  try {
    if (!request || !request?.action || request.target !== REQUEST_TARGETS.BACKGROUND_PROMPT) {
      return false;
    }
  
    switch (request.action) {
      case REQUEST_ACTIONS.GET_LOCAL_KEY: {
        getLocalKey()
          .then(lKey => { sendResponse({ status: 'ok', data: lKey }); })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });

        break;
      }

      case REQUEST_ACTIONS.PROMPT_INPUT: {
        if (!request?.data || !request?.data?.id || !sender?.tab?.id) {
          sendResponse({ status: 'error', message: 'Empty data' });
          return true;
        }

        promptInput(request, sender, tabsInputData)
          .then(() => { sendResponse({ status: 'ok' }); })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });
          
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

export default onPromptMessage;
