// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { onWebRequest } from './events';
import isSavePromptSupported from '@/partials/functions/isSavePromptSupported';

// sub_frame so classic <form> POSTs navigating a same-site iframe reach the save
// prompt; onWebRequest gates them to the tab's root domain (finding #19).
// 'ping' covers the prompt.js beacon in Chromium, which reports navigator.sendBeacon() as 'ping'.
const SAVE_PROMPT_REQUEST_TYPES = Object.freeze(['main_frame', 'sub_frame', 'xmlhttprequest', 'ping']);

/**
* Function to register the webRequest listeners that detect login submissions for the save prompt.
* Firefox and Safari report navigator.sendBeacon() as 'beacon' (Chromium rejects 'beacon' in a filter), so they get
* a second listener limited to the prompt.js beacon URL, which keeps other sites' analytics beacons out.
* @param {Object} tabsInputData - The input data for all tabs.
* @param {Array} savePromptActions - The list of save prompt actions.
* @param {Object} tabUpdateData - The data for updating tabs.
* @return {boolean} True when the submission listener was registered.
*/
const registerSavePromptWebRequest = (tabsInputData, savePromptActions, tabUpdateData) => {
  if (!isSavePromptSupported() || !browser?.webRequest?.onBeforeRequest) {
    return false;
  }

  try {
    browser.webRequest.onBeforeRequest.addListener(
      details => onWebRequest(details, tabsInputData, savePromptActions, tabUpdateData),
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
        details => onWebRequest(details, tabsInputData, savePromptActions, tabUpdateData),
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
