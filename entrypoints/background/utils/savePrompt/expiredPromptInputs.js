// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Time after which a captured value no longer counts for a login request and is removed from memory.
* @type {number}
*/
export const PROMPT_INPUT_TTL_MS = 10 * 60 * 1000;

/**
* Function to tell whether a captured input is older than its time to live.
* @param {Object} inputData - The captured input data.
* @param {number} [now=Date.now()] - The current time in milliseconds.
* @return {boolean} True when the input has expired.
*/
export const isExpiredPromptInput = (inputData, now = Date.now()) => typeof inputData?.timestamp === 'number' && now - inputData.timestamp > PROMPT_INPUT_TTL_MS;

/**
* Function to remove the expired inputs of a tab.
* @param {Object} tabsInputData - The captured inputs of all tabs.
* @param {number} tabId - The ID of the tab.
* @param {number} [now=Date.now()] - The current time in milliseconds.
* @return {void}
*/
export const dropExpiredPromptInputs = (tabsInputData, tabId, now = Date.now()) => {
  const tabInputs = tabsInputData?.[tabId];

  if (!tabInputs) {
    return;
  }

  Object.keys(tabInputs).forEach(id => {
    if (isExpiredPromptInput(tabInputs[id], now)) {
      delete tabInputs[id];
    }
  });
};
