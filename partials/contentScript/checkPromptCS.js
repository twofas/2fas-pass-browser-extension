// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import injectCSIfNotAlready from './injectCSIfNotAlready';

/** 
* Checks if the prompt content script is injected, and injects it if not.
* @async
* @param {number} tabId - The ID of the tab to check.
* @return {Promise<void>}
*/
const checkPromptCS = async tabId => {
  const storagePrompt = await storage.getItem('local:savePrompt');

  if (!storagePrompt || storagePrompt === 'default' || storagePrompt === 'default_encrypted') {
    await injectCSIfNotAlready(tabId, REQUEST_TARGETS.PROMPT);
  }
};

export default checkPromptCS;
