// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to remove the save prompt action of a tab. A tab has at most one action (addSavePromptAction replaces it),
* so it is matched by the tab only: the page url can change between the request and the user's answer.
* @param {number} tabId - The ID of the tab.
* @param {Array} savePromptActions - The list of save prompt actions.
* @return {void}
*/
const removeSavePromptAction = (tabId, savePromptActions) => {
  const actionIndex = savePromptActions.findIndex(action => action.tabId === tabId);

  if (actionIndex !== -1) {
    savePromptActions.splice(actionIndex, 1);
  }
};

export default removeSavePromptAction;
