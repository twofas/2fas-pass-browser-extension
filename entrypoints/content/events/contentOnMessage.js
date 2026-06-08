// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import checkAutofillInputs from '../functions/checkAutofillInputs';
import checkAutofillInputsCard from '../functions/checkAutofillInputsCard';
import checkIframePermission from '../functions/checkIframePermission';
import autofill from '../functions/autofill';
import autofillCard from '../functions/autofillCard';
import getDomainInfo from '../functions/getDomainInfo';
import notification from '../functions/notification';
import matchingLogins from '../functions/matchingLogins';
import savePrompt, { dismissAllSavePrompts } from '../functions/savePrompt';
import refreshTheme from '../functions/refreshTheme';
import refreshLang from '../functions/refreshLang';
import crossDomainDialog from '../functions/crossDomainDialog';
import e2eReadAutofillValues from '../functions/e2eReadAutofillValues';

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

    // DEV-only autofill E2E read seam: runs in EVERY frame (the login form may be in an
    // iframe), so it is handled before the top-frame-only gate below. Stripped from
    // production — import.meta.env.DEV is false → the whole branch tree-shakes away.
    if (import.meta.env.DEV && request.action === REQUEST_ACTIONS.E2E_READ_AUTOFILL_VALUES) {
      sendResponse(e2eReadAutofillValues());
      return true;
    }

    if (
      request?.action === REQUEST_ACTIONS.MATCHING_LOGINS ||
      request?.action === REQUEST_ACTIONS.NOTIFICATION ||
      request?.action === REQUEST_ACTIONS.SAVE_PROMPT ||
      request?.action === REQUEST_ACTIONS.DISMISS_SAVE_PROMPT ||
      request?.action === REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE ||
      request?.action === REQUEST_ACTIONS.SHOW_CROSS_DOMAIN_CONFIRM ||
      request?.action === REQUEST_ACTIONS.REFRESH_THEME ||
      request?.action === REQUEST_ACTIONS.REFRESH_LANG
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
        logger.info(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'ContentScript - autofill triggered', { topFrame: isTopFrame });

        autofill(request)
          .then(autofillStatus => {
            logger.info(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'ContentScript - autofill result', { status: autofillStatus?.status });
            sendResponse(autofillStatus);
          })
          .catch(error => {
            logger.error(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'ContentScript - autofill failed', { errorName: error?.name });
            sendResponse({ status: 'error', message: 'Autofill failed', error });
          });

        break;
      }

      case REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS_CARD: {
        sendResponse(checkAutofillInputsCard());
        break;
      }

      case REQUEST_ACTIONS.CHECK_IFRAME_PERMISSION: {
        checkIframePermission(request.autofillType, request.dataFields)
          .then(result => { sendResponse(result); })
          .catch(() => { sendResponse({ needsPermission: false, frameInfo: {} }); });

        break;
      }

      case REQUEST_ACTIONS.AUTOFILL_CARD: {
        autofillCard(request)
          .then(autofillStatus => { sendResponse(autofillStatus); })
          .catch(error => { sendResponse({ status: 'error', message: 'Autofill card failed', error }); });

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

      case REQUEST_ACTIONS.DISMISS_SAVE_PROMPT: {
        dismissAllSavePrompts(container);
        sendResponse({ status: 'ok' });
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

      case REQUEST_ACTIONS.SHOW_CROSS_DOMAIN_CONFIRM: {
        crossDomainDialog(request, sendResponse, container);
        break;
      }

      case REQUEST_ACTIONS.REFRESH_THEME: {
        refreshTheme(request.theme, container);
        sendResponse({ status: 'ok' });
        break;
      }

      case REQUEST_ACTIONS.REFRESH_LANG: {
        resetI18nCache();
        initI18n()
          .then(() => {
            refreshLang(container);
            sendResponse({ status: 'ok' });
          })
          .catch(() => { sendResponse({ status: 'error' }); });

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
