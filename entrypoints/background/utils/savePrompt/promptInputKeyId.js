// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLocalKey from '../getLocalKey';
import getLocalKeyId from '../getLocalKeyId';

/**
* Function to get the id of the current local key.
* @async
* @return {Promise<string|null>} The key id, or null when there is no key.
*/
export const getCurrentLocalKeyId = async () => getLocalKeyId(await getLocalKey());

/**
* Function to tell whether a captured input was encrypted with a local key other than the current one. Such a value can
* never be decrypted: the key rotates on every lock.
* @param {Object} inputData - The captured input data.
* @param {string|null} currentKeyId - The id of the current local key.
* @return {boolean} True for an encrypted value of another key.
*/
export const isStalePromptInput = (inputData, currentKeyId) => inputData?.encrypted === true && (!currentKeyId || inputData?.keyId !== currentKeyId);

/**
* Function to remove the inputs of a tab encrypted with an old local key.
* @param {Object} tabsInputData - The captured inputs of all tabs.
* @param {number} tabId - The ID of the tab.
* @param {string|null} currentKeyId - The id of the current local key.
* @return {void}
*/
export const dropStalePromptInputs = (tabsInputData, tabId, currentKeyId) => {
  const tabInputs = tabsInputData?.[tabId];

  if (!tabInputs) {
    return;
  }

  Object.keys(tabInputs).forEach(id => {
    if (isStalePromptInput(tabInputs[id], currentKeyId)) {
      delete tabInputs[id];
    }
  });
};

/**
* Function to tell whether any input of a tab is encrypted, so the current key id is worth computing.
* @param {Object} tabsInputData - The captured inputs of all tabs.
* @param {number} tabId - The ID of the tab.
* @return {boolean} True when the tab has an encrypted input.
*/
export const hasEncryptedPromptInputs = (tabsInputData, tabId) => Object.values(tabsInputData?.[tabId] || {}).some(inputData => inputData?.encrypted === true);
