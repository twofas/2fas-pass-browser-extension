// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import removeSavePromptAction from './removeSavePromptAction';
import decryptValues from './decryptValues';
import openPopupWindowInNewWindow from '../openPopupWindowInNewWindow';
import { SAVE_PROMPT_ACTIONS, PULL_REQUEST_TYPES, REQUEST_STRING_ACTIONS } from '@/constants';
import { valueToNFKD, getCurrentDevice } from '@/partials/functions';
import Login from '@/partials/models/itemModels/Login';

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
    case SAVE_PROMPT_ACTIONS.NEW_LOGIN: {
      let decryptedValues;

      if (values?.encrypted) {
        decryptedValues = await decryptValues(values);
      } else {
        decryptedValues = {
          username: values.username,
          password: values.password
        };
      }

      const device = await getCurrentDevice();

      if (!device) {
        throw new Error('No device found. Cannot proceed with saving new login.');
      }

      const data = JSON.stringify({
        action: PULL_REQUEST_TYPES.ADD_DATA,
        from: 'savePrompt',
        data: {
          contentType: Login.contentType,
          content: {
            url: valueToNFKD(url),
            username: { value: valueToNFKD(decryptedValues.username), action: REQUEST_STRING_ACTIONS.SET },
            s_password: { value: valueToNFKD(decryptedValues.password), action: REQUEST_STRING_ACTIONS.SET }
          }
        },
        deviceId: device.id
      });
  
      await openPopupWindowInNewWindow({ pathname: `/fetch/${encodeURIComponent(data)}` });

      removeSavePromptAction(tabId, url, savePromptActions);
      tabUpdateData[tabId].savePromptVisible = false;
      return;
    }

    case SAVE_PROMPT_ACTIONS.UPDATE_LOGIN: {
      let decryptedValues;

      if (values?.encrypted) {
        decryptedValues = await decryptValues(values);
      } else {
        decryptedValues = {
          username: values.username,
          password: values.password
        };
      }

      const data = JSON.stringify({
        action: PULL_REQUEST_TYPES.UPDATE_DATA,
        from: 'savePrompt',
        data: {
          contentType: res.contentType,
          deviceId: res.deviceId,
          vaultId: res.vaultId,
          itemId: res.itemId,
          content: {
            s_password: { value: decryptedValues.password, action: REQUEST_STRING_ACTIONS.SET }
          }
        }
      });

      await openPopupWindowInNewWindow({ pathname: `/fetch/${encodeURIComponent(data)}` });

      removeSavePromptAction(tabId, url, savePromptActions);
      tabUpdateData[tabId].savePromptVisible = false;
      return;
    }

    case SAVE_PROMPT_ACTIONS.DO_NOT_ASK: {
      let storageIgnoreList = await storage.getItem('local:savePromptIgnoreDomains');

      if (!storageIgnoreList || !Array.isArray(storageIgnoreList)) {
        storageIgnoreList = [];
      }
      
      storageIgnoreList.push(new URL(url).hostname);
      await storage.setItem('local:savePromptIgnoreDomains', storageIgnoreList);

      removeSavePromptAction(tabId, url, savePromptActions);
      tabUpdateData[tabId].savePromptVisible = false;
      return;
    }

    case SAVE_PROMPT_ACTIONS.CANCEL: {
      removeSavePromptAction(tabId, url, savePromptActions);
      tabUpdateData[tabId].savePromptVisible = false;
      return;
    }

    default: break;
  }
};

export default handleSavePromptResponse;
