// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import injectPromptCSIntoFrames from './injectPromptCSIntoFrames';

/**
* Pending checks per tab. tabs.onActivated and tabs.onUpdated can reach checkPromptCS for the same tab at the same
* moment; sharing the pending check keeps prompt.js from being injected twice into one document.
* @type {Map<number, Promise<void>>}
*/
const pendingChecks = new Map();

/**
* Injects the prompt content script when the save prompt is enabled.
* @async
* @param {number} tabId - The ID of the tab to check.
* @return {Promise<void>}
*/
const injectPromptCS = async tabId => {
  if (import.meta.env.BROWSER === 'safari') {
    return;
  }

  const storagePrompt = await storage.getItem('local:savePrompt');

  if (!storagePrompt || storagePrompt === 'default' || storagePrompt === 'default_encrypted') {
    await injectPromptCSIntoFrames(tabId);
  }
};

/**
* Checks if the prompt content script is injected, and injects it if not. Skipped on Safari.
* @async
* @param {number} tabId - The ID of the tab to check.
* @return {Promise<void>}
*/
const checkPromptCS = tabId => {
  if (pendingChecks.has(tabId)) {
    return pendingChecks.get(tabId);
  }

  const check = injectPromptCS(tabId).finally(() => {
    pendingChecks.delete(tabId);
  });

  pendingChecks.set(tabId, check);

  return check;
};

export default checkPromptCS;
