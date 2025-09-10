// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import checkAutofillInputs from '../functions/checkAutofillInputs';
import autofill from '../functions/autofill';
import getDomainInfo from '../functions/getDomainInfo';
import notification from '../functions/notification';
import matchingLogins from '../functions/matchingLogins';
import savePrompt from '../functions/savePrompt';

/** 
* Function to handle messages on the content script.
* @param {Object} request - The request object.
* @param {Object} sender - The sender object.
* @param {Function} sendResponse - The function to send a response.
* @param {boolean} isTopFrame - Indicates if the request is from the top frame.
* @param {HTMLElement} container - The container element.
* @param {boolean} cryptoAvailable - Indicates if the WebCrypto API is available.
* @return {boolean} Indicates if the message was handled.
*/
const contentOnMessage = (request, sender, sendResponse, isTopFrame, container, cryptoAvailable) => {
  try {
    if (!request || !request?.action || request?.target !== REQUEST_TARGETS.CONTENT) {
      return false;
    }

    // IS TOP FRAME CHECK
    if (
      // request?.action === REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK ||
      request?.action === REQUEST_ACTIONS.MATCHING_LOGINS || 
      request?.action === REQUEST_ACTIONS.NOTIFICATION || 
      request?.action === REQUEST_ACTIONS.SAVE_PROMPT ||
      request?.action === REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE
    ) {
      if (!isTopFrame) {
        return false;
      }
    }
  
    switch (request.action) {
      case REQUEST_ACTIONS.GET_DOMAIN_INFO: {
        sendResponse(getDomainInfo());
        break;
      }

      case REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS: {
        sendResponse(checkAutofillInputs());
        break;
      }
  
      case REQUEST_ACTIONS.AUTOFILL: {
        autofill(request)
          .then(autofillStatus => { sendResponse(autofillStatus); })
          .catch(error => { sendResponse({ status: 'error', message: 'Autofill failed', error }); });

        break;
      }

      case REQUEST_ACTIONS.NOTIFICATION: {
        const notificationStatus = notification(request, container);
        sendResponse(notificationStatus);
        break;
      }
  
      case REQUEST_ACTIONS.MATCHING_LOGINS: {
        matchingLogins(request, sendResponse, container);
        break;
      }

      case REQUEST_ACTIONS.SAVE_PROMPT: {
        savePrompt(request, sendResponse, container);
        break;
      }
  
      case REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK: {
        sendResponse({ status: 'ok' });
        break;
      }

      case REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE: {
        sendResponse({ status: 'ok', cryptoAvailable });
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

export default contentOnMessage;
