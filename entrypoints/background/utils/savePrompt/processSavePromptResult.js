// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decryptValues from './decryptValues';
import openPopupWindowInNewWindow from '../openPopupWindowInNewWindow';
import { SAVE_PROMPT_ACTIONS, REQUEST_STRING_ACTIONS, PULL_REQUEST_TYPES } from '@/constants';
import { getCurrentDevice } from '@/partials/functions';
import Login from '@/models/itemModels/Login';

/**
* Processes the save prompt result sent from the content script.
* This handles the case where the service worker may have been terminated
* while the user was interacting with the save prompt.
* @async
* @param {Object} request - The result from the content script.
* @param {string} request.storageKey - The session storage key for context.
* @param {string} request.status - The user's action (newLogin, updateLogin, doNotAsk, cancel).
* @return {Promise<void>}
*/
const processSavePromptResult = async request => {
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

  const { url, values } = context;
  await storage.removeItem(storageKey);

  switch (status) {
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

      storageIgnoreList.push(new URL(url).hostname);
      await storage.setItem('local:savePromptIgnoreDomains', storageIgnoreList);
      return;
    }

    case SAVE_PROMPT_ACTIONS.CANCEL: {
      return;
    }

    default: break;
  }
};

export default processSavePromptResult;
