// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to remove a save prompt action from the list.
* @param {string} tabId - The ID of the tab.
* @param {string} url - The URL of the page.
* @param {Array} savePromptActions - The list of save prompt actions.
* @return {void}
*/
const removeSavePromptAction = (tabId, url, savePromptActions) => {
  const actionIndex = savePromptActions.findIndex(action => action.tabId === tabId && action.url === url);
  
  if (actionIndex !== -1) {
    savePromptActions.splice(actionIndex, 1);
  }
};

export default removeSavePromptAction;
