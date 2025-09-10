// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { onIdleStateChange, onWebRequest, onUpdateAvailable } from './events';

/** 
* Function to handle non-Safari background tasks.
* @param {Object} tabsInputData - The input data for all tabs.
* @param {Array} savePromptActions - The list of save prompt actions.
* @param {Object} tabUpdateData - The data for updating tabs.
* @return {void}
*/
const nonSafariBackground = (tabsInputData, savePromptActions, tabUpdateData) => {
  browser.idle.onStateChanged.addListener(onIdleStateChange);

  browser.webRequest.onBeforeRequest.addListener(
    details => onWebRequest(details, tabsInputData, savePromptActions, tabUpdateData),
    { urls: ['<all_urls>'], types: ['main_frame', 'xmlhttprequest'] },
    ['requestBody']
  );

  browser.runtime.onUpdateAvailable.addListener(onUpdateAvailable);
};

export default nonSafariBackground;
