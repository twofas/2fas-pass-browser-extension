// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { onWebRequest } from './events';
import isSavePromptSupported from '@/partials/functions/isSavePromptSupported';
import { completeSavePromptRequest, isFailedResponseStatus } from './utils/savePrompt/pendingSavePromptRequests';

// sub_frame so classic <form> POSTs navigating a same-site iframe reach the save
// prompt; onWebRequest gates them to the tab's root domain (finding #19).
// 'ping' covers the prompt.js beacon in Chromium, which reports navigator.sendBeacon() as 'ping'.
const SAVE_PROMPT_REQUEST_TYPES = Object.freeze(['main_frame', 'sub_frame', 'xmlhttprequest', 'ping']);

// The requests whose response decides whether the save prompt is shown (beacons and pings never carry a login).
const SAVE_PROMPT_RESPONSE_TYPES = Object.freeze(['main_frame', 'sub_frame', 'xmlhttprequest']);

/**
* Function to register the listeners reporting how login requests ended, so the save prompt waits for the response.
* @param {Map} pendingRequests - The login requests waiting for their response.
* @return {boolean} True when both listeners were registered.
*/
const registerResponseListeners = pendingRequests => {
  if (!browser?.webRequest?.onCompleted || !browser?.webRequest?.onErrorOccurred) {
    return false;
  }

  const filter = { urls: ['<all_urls>'], types: [...SAVE_PROMPT_RESPONSE_TYPES] };

  /**
  * Function to record how a request ended, showing its save prompt when it was waiting for the response.
  * @param {Object} details - The details of the web request.
  * @param {boolean} succeeded - False when the request failed or its response has an error status.
  * @return {Promise<void>}
  */
  const complete = (details, succeeded) => completeSavePromptRequest(pendingRequests, details?.requestId, succeeded).catch(e => CatchError(e));

  try {
    browser.webRequest.onCompleted.addListener(details => complete(details, !isFailedResponseStatus(details?.statusCode)), filter);
    browser.webRequest.onErrorOccurred.addListener(details => complete(details, false), filter);
  } catch (e) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.BACKGROUND, 'registerSavePromptWebRequest - response addListener failed', { errorName: e?.name, errorMessage: e?.message });
    return false;
  }

  return true;
};

/**
* Function to register the webRequest listeners that detect login submissions for the save prompt.
* Firefox and Safari report navigator.sendBeacon() as 'beacon' (Chromium rejects 'beacon' in a filter), so they get
* a second listener limited to the prompt.js beacon URL, which keeps other sites' analytics beacons out. Where the
* browser reports how requests end, the prompt is shown only after the login request completed without an error status.
* @param {Object} tabsInputData - The input data for all tabs.
* @param {Array} savePromptActions - The list of save prompt actions.
* @return {boolean} True when the submission listener was registered.
*/
const registerSavePromptWebRequest = (tabsInputData, savePromptActions) => {
  if (!isSavePromptSupported() || !browser?.webRequest?.onBeforeRequest) {
    return false;
  }

  const pendingRequests = new Map();
  const waitsForResponse = registerResponseListeners(pendingRequests);

  /**
  * Function to handle a request that may carry a login.
  * @param {Object} details - The details of the web request.
  * @return {Promise<void>}
  */
  const handleRequest = details => (waitsForResponse
    ? onWebRequest(details, tabsInputData, savePromptActions, pendingRequests)
    : onWebRequest(details, tabsInputData, savePromptActions));

  try {
    browser.webRequest.onBeforeRequest.addListener(
      handleRequest,
      { urls: ['<all_urls>'], types: [...SAVE_PROMPT_REQUEST_TYPES] },
      ['requestBody']
    );
  } catch (e) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.BACKGROUND, 'registerSavePromptWebRequest - addListener failed', { errorName: e?.name, errorMessage: e?.message });
    return false;
  }

  if (import.meta.env.BROWSER === 'firefox' || import.meta.env.BROWSER === 'safari') {
    try {
      browser.webRequest.onBeforeRequest.addListener(
        details => handleRequest(details),
        { urls: [`https://${import.meta.env.VITE_BEACON}.invalid/*`], types: ['beacon'] },
        ['requestBody']
      );
    } catch (e) {
      logger.error(LOGGER_CONSTANTS.CATEGORIES.BACKGROUND, 'registerSavePromptWebRequest - beacon addListener failed', { errorName: e?.name, errorMessage: e?.message });
    }
  }

  return true;
};

export default registerSavePromptWebRequest;
