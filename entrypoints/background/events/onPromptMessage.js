// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { promptInput, isSavePromptSenderEligible } from '../utils';

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
      case REQUEST_ACTIONS.PROMPT_INPUT: {
        if (!request?.data || !request?.data?.id || !sender?.tab?.id) {
          sendResponse({ status: 'error', message: 'Empty data' });
          return true;
        }

        // Defence-in-depth: only same-root-domain frames may capture credentials,
        // even if a cross-domain frame forged this message (finding #19).
        isSavePromptSenderEligible(sender)
          .then(eligible => {
            if (!eligible) {
              sendResponse({ status: 'error', message: 'Ineligible frame' });
              return;
            }

            return promptInput(request, sender, tabsInputData)
              .then(() => { sendResponse({ status: 'ok' }); });
          })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });

        break;
      }

      case REQUEST_ACTIONS.PROMPT_INPUT_FLUSH: {
        if (!Array.isArray(request?.data) || !sender?.tab?.id) {
          sendResponse({ status: 'error', message: 'Invalid flush data' });
          return true;
        }

        isSavePromptSenderEligible(sender)
          .then(eligible => {
            if (!eligible) {
              sendResponse({ status: 'error', message: 'Ineligible frame' });
              return;
            }

            if (!tabsInputData[sender.tab.id]) {
              tabsInputData[sender.tab.id] = {};
            }

            request.data.forEach(inputData => {
              if (inputData?.id) {
                tabsInputData[sender.tab.id][inputData.id] = inputData;
              }
            });

            sendResponse({ status: 'ok' });
          })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });

        break;
      }

      case REQUEST_ACTIONS.IGNORE_SAVE_PROMPT: {
        if (!request?.tabId) {
          sendResponse({ status: 'error', message: 'Tab ID not found' });
          return true;
        }

        tabsInputData[request.tabId] = {};
        sendResponse({ status: 'ok' });
        break;
      }

      case REQUEST_ACTIONS.GET_SAVE_PROMPT: {
        // Tell the prompt content script whether this frame may capture credentials
        // (top frame or same-root-domain sub-frame) so it can self-gate (finding #19).
        Promise.all([
          storage.getItem('local:savePrompt'),
          isSavePromptSenderEligible(sender)
        ])
          .then(([res, eligible]) => { sendResponse({ status: 'ok', data: res, eligible }); })
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
