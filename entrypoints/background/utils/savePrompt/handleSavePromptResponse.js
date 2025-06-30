// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import removeSavePromptAction from './removeSavePromptAction';
import decryptValues from './decryptValues';
import openPopupWindowInNewWindow from '../openPopupWindowInNewWindow';

// FUTURE - actions should be moved to a separate files
/** 
* Function to handle the response from the save prompt.
* @async
* @param {Object} res - The response object from the save prompt.
* @param {string} tabId - The ID of the tab.
* @param {string} url - The URL of the page.
* @param {Object} values - The values to save.
* @param {Array} savePromptActions - The list of save prompt actions.
* @param {Object} tabUpdateData - The data related to the tab update.
* @return {Promise<void>} A promise that resolves when the handling is complete.
*/
const handleSavePromptResponse = async (res, tabId, url, values, savePromptActions, tabUpdateData) => {
  if (!res?.status) {
    return;
  }

  // FUTURE - separate functions for each action
  switch (res.status) {
    case 'addLogin': { // FUTURE - consts for actions
      const decryptedValues = await decryptValues(values);

      const data = JSON.stringify({
        action: 'newLogin',
        from: 'savePrompt',
        data: {
          url,
          username: decryptedValues.username,
          password: decryptedValues.password
          // FUTURE - add minLength, maxLength etc.
        }
      });
  
      await openPopupWindowInNewWindow({ pathname: `/fetch/${encodeURIComponent(data)}` });

      removeSavePromptAction(tabId, url, savePromptActions);
      tabUpdateData[tabId].savePromptVisible = false;
      return;
    }

    case 'doNotAsk': {
      let storageIgnoreList = await storage.getItem('local:savePromptIgnoreDomains');

      if (!storageIgnoreList || !Array.isArray(storageIgnoreList)) {
        storageIgnoreList = [];
      }
      
      storageIgnoreList.push(new URL(details.url).hostname);
      await storage.setItem('local:savePromptIgnoreDomains', storageIgnoreList);

      removeSavePromptAction(tabId, url, savePromptActions);
      tabUpdateData[tabId].savePromptVisible = false;
      return;
    }

    case 'cancel': {
      removeSavePromptAction(tabId, url, savePromptActions);
      tabUpdateData[tabId].savePromptVisible = false;
      return;
    }

    default: break;
  }
};

export default handleSavePromptResponse;
