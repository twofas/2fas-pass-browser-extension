// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendDomainToPopupWindow from '../utils/sendDomainToPopupWindow';
import isTabIsPopupWindow from './isTabIsPopupWindow';
import setBadge from '../utils/setBadge';
import updateNoAccountItem from '../contextMenu/updateNoAccountItem';
import checkPromptCS from '@/partials/contentScript/checkPromptCS';
import sendSavePromptToTab from '../utils/sendSavePromptToTab';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import removeSavePromptAction from '../utils/savePrompt/removeSavePromptAction';
import handleSavePromptResponse from '../utils/savePrompt/handleSavePromptResponse';
import { parseDomain } from 'parse-domain';

/** 
* Function to handle tab updates in the browser.
* @async
* @param {number} tabID - The ID of the tab that was updated.
* @param {Object} changeInfo - Information about the change that occurred to the tab.
* @param {Array} savePromptActions - An array of actions related to saving prompts.
* @param {Object} tabUpdateData - An object containing data related to the tab updates.
* @return {Promise<boolean>} A promise that resolves to true if the tab update was handled successfully, false otherwise.
*/
const onTabUpdated = async (tabID, changeInfo, savePromptActions, tabUpdateData) => {
  if (!tabUpdateData[tabID] || typeof tabUpdateData[tabID] !== 'object') {
    tabUpdateData[tabID] = { url: null, savePromptVisible: false };
  }

  if (!tabID || !changeInfo || (changeInfo.title && Object.keys(changeInfo).length === 1)) {
    return false;
  }
  
  let pw, tab;
  
  try {
    tab = await browser.tabs.get(tabID);
  } catch {
    return false;
  }

  if (!tab || !tab.active) {
    return false;
  }
  
  try {
    pw = await isTabIsPopupWindow(tabID);
  } catch {
    pw = false;
  }
  
  if (!pw) {
    try {
      if (tab?.url) {
        if (!tabUpdateData[tabID].url || tabUpdateData[tabID].url !== tab.url) {
          tabUpdateData[tabID].url = tab.url;
          tabUpdateData[tabID].savePromptVisible = false;
        }

        try {
          await setBadge(tab.url, tabID);
        } catch (e) {
          await CatchError(e);
        }
      }

      await sendDomainToPopupWindow(tabID);
      
      if (changeInfo?.status === 'complete') {
        await updateNoAccountItem(tabID);
        await checkPromptCS(tabID);

        const action = savePromptActions.filter(a => a.tabId === tabID)[0];

        if (action && !tabUpdateData[tabID].savePromptVisible) {
          tabUpdateData[tabID].savePromptVisible = true;

          await injectCSIfNotAlready(tabID, REQUEST_TARGETS.CONTENT);

          let actionUrlHostname = action.url || '';
          let tabUrlHostname = tab.url || '';
          let parsedActionUrl, parsedTabUrl;

          try {
            actionUrlHostname = new URL(action.url).hostname;
            tabUrlHostname = new URL(tab.url).hostname;
            parsedActionUrl = parseDomain(actionUrlHostname);
            parsedTabUrl = parseDomain(tabUrlHostname);
          } catch {}

          if (`${parsedActionUrl.domain}.${parsedActionUrl.topLevelDomains[0]}` !== `${parsedTabUrl.domain}.${parsedTabUrl.topLevelDomains[0]}`) {
            removeSavePromptAction(tabID, action.url, savePromptActions);
            return;
          }

          const res = await sendSavePromptToTab(tabID, action.serviceType);
          await handleSavePromptResponse(
            res,
            tabID,
            action.url,
            { username: action.username, password: action.password },
            savePromptActions,
            tabUpdateData
          );
        }          
      }
    } catch (e) {
      await CatchError(e);
    }
  }
};

export default onTabUpdated;
