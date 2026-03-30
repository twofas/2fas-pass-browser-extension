// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decryptValues from './decryptValues';
import removeSavePromptAction from './removeSavePromptAction';
import openPopupWindowInNewWindow from '../openPopupWindowInNewWindow';
import { SAVE_PROMPT_ACTIONS, REQUEST_STRING_ACTIONS, PULL_REQUEST_TYPES } from '@/constants';
import { getCurrentDevice } from '@/partials/functions';
import Login from '@/models/itemModels/Login';

/**
* Cleans up save prompt state after the user has made a choice.
* Removes the action from the in-memory array and resets tab visibility.
* @param {string} tabId - The tab ID from the save prompt context.
* @param {string} url - The URL from the save prompt context.
* @param {Array} savePromptActions - The in-memory array of pending save prompt actions.
* @param {Object} tabUpdateData - The tab update tracking data.
* @return {void}
*/
const cleanupSavePromptState = (tabId, url, savePromptActions, tabUpdateData) => {
  if (savePromptActions && Array.isArray(savePromptActions)) {
    removeSavePromptAction(tabId, url, savePromptActions);
  }

  if (tabUpdateData && tabUpdateData[tabId]) {
    tabUpdateData[tabId].savePromptVisible = false;
  }
};

/**
* Processes the save prompt result sent from the content script.
* This handles the case where the service worker may have been terminated
* while the user was interacting with the save prompt.
* @async
* @param {Object} request - The result from the content script.
* @param {string} request.storageKey - The session storage key for context.
* @param {string} request.status - The user's action (newLogin, updateLogin, doNotAsk, cancel).
* @param {Array} savePromptActions - The in-memory array of pending save prompt actions.
* @param {Object} tabUpdateData - The tab update tracking data.
* @param {Object} tabsInputData - The in-memory input data for all tabs.
* @return {Promise<void>}
*/
const processSavePromptResult = async (request, savePromptActions, tabUpdateData, tabsInputData) => {
  const { storageKey, status } = request;

  if (!storageKey || !status) {
    return;
  }

  let context;

  try {
    const contextJson = await storage.getItem(storageKey);

    if (!contextJson) {
      return;
    }

    context = JSON.parse(contextJson);
  } catch (e) {
    await CatchError(e);
    return;
  }

  const { tabId, url, tabUrl, values } = context;
  await storage.removeItem(storageKey);

  cleanupSavePromptState(tabId, url, savePromptActions, tabUpdateData);

  switch (status) {
    case SAVE_PROMPT_ACTIONS.NEW_LOGIN: {
      await storage.setItem(`session:savePromptSuppressed-${tabId}`, true);

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
            url,
            username: { value: decryptedValues.username, action: REQUEST_STRING_ACTIONS.SET },
            s_password: { value: decryptedValues.password, action: REQUEST_STRING_ACTIONS.SET }
          }
        },
        deviceId: device.id
      });

      await openPopupWindowInNewWindow({ pathname: `/fetch/${encodeURIComponent(data)}` });
      return;
    }

    case SAVE_PROMPT_ACTIONS.UPDATE_LOGIN: {
      await storage.setItem(`session:savePromptSuppressed-${tabId}`, true);

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
          contentType: request.contentType,
          deviceId: request.deviceId,
          vaultId: request.vaultId,
          itemId: request.itemId,
          content: {
            s_password: { value: decryptedValues.password, action: REQUEST_STRING_ACTIONS.SET }
          }
        }
      });

      await openPopupWindowInNewWindow({ pathname: `/fetch/${encodeURIComponent(data)}` });
      return;
    }

    case SAVE_PROMPT_ACTIONS.DO_NOT_ASK: {
      let storageIgnoreList = await storage.getItem('local:savePromptIgnoreDomains');

      if (!storageIgnoreList || !Array.isArray(storageIgnoreList)) {
        storageIgnoreList = [];
      }

      const ignoreUrl = tabUrl || url;
      storageIgnoreList.push(new URL(ignoreUrl).hostname);
      await storage.setItem('local:savePromptIgnoreDomains', storageIgnoreList);

      await storage.setItem(`session:savePromptSuppressed-${tabId}`, true);

      if (tabsInputData && tabsInputData[tabId]) {
        delete tabsInputData[tabId];
        tabsInputData[tabId] = {};
      }

      return;
    }

    case SAVE_PROMPT_ACTIONS.CANCEL: {
      return;
    }

    default: break;
  }
};

export default processSavePromptResult;
