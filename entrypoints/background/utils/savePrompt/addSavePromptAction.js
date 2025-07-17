// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to add a save prompt action.
* @async
* @param {Object} details - The details of the tab.
* @param {string} serviceType - The type of service.
* @param {Object} values - The values to save.
* @param {Array} savePromptActions - The array of save prompt actions.
* @return {Promise<void>} A promise that resolves when the action is added.
*/
const addSavePromptAction = async (details, serviceType, values, savePromptActions) => {
  if (!details || !serviceType || !values || !savePromptActions) {
    // FUTURE - throw error?
    return;
  }

  const { tabId, url } = details;
  const { username, password } = values;

  // Check if action for this tabId already exists, if it does, remove it
  const existingActionIndex = savePromptActions.findIndex(action => action.tabId === tabId);
  if (existingActionIndex !== -1) {
    savePromptActions.splice(existingActionIndex, 1);
  }

  const action = { tabId, url, username, password, serviceType };
  savePromptActions.push(action);
};

export default addSavePromptAction;
