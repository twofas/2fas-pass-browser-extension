// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendSavePromptToTab from '../sendSavePromptToTab';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import handleSavePromptResponse from './handleSavePromptResponse';

// FUTURE - Try to check initial inputs list? Probably request to content_script?
/** 
* Function to remove previous and current tab input data.
* @async
* @param {string} tabId - The ID of the tab.
* @param {Object} tabsInputData - The input data for all tabs.
* @return {Promise<void>} A promise that resolves when the operation is complete.
*/
const removePreviousAndCurrentTabInputData = async (tabId, tabsInputData) => {
  if (tabsInputData[tabId]) {
    delete tabsInputData[tabId];
    tabsInputData[tabId] = {};
  }

  let currentTab;

  try {
    currentTab = await browser?.tabs?.getCurrent();
  } catch {
    return false;
  }

  if (currentTab?.id && tabsInputData[currentTab.id]) {
    delete tabsInputData[currentTab.id];
    tabsInputData[currentTab.id] = {};
  }
};

/** 
* Function to save the prompt action.
* @async
* @param {Object} details - The details of the web request.
* @param {string} serviceType - The type of service for the save prompt.
* @param {Object} tabsInputData - The input data for all tabs.
* @param {Object} values - The values to save in the prompt.
* @param {Array} savePromptActions - The actions to save the prompt.
* @param {Object} tabUpdateData - Data for updating the tab.
* @return {Promise<void>} A promise that resolves when the save prompt action is complete.
*/
const savePromptAction = async (details, serviceType, tabsInputData, values, savePromptActions, tabUpdateData) => {
  let tabData;
  
  try {
    tabData = await browser.tabs.get(details?.tabId);
  } catch {
    return;
  }
  
  while (tabData?.status === 'loading') {
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      tabData = await browser.tabs.get(details?.tabId);
    } catch {
      break;
    }
  }

  await injectCSIfNotAlready(details?.tabId, REQUEST_TARGETS.CONTENT);
  await removePreviousAndCurrentTabInputData(details.tabId, tabsInputData);

  const res = await sendSavePromptToTab(details.tabId, serviceType);
  await handleSavePromptResponse(res, details.tabId, details.url, values, savePromptActions, tabUpdateData);

  return;
};

export default savePromptAction;
