// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendSavePromptToTab from '../sendSavePromptToTab';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import { getPageUrl } from '@/partials/functions';
import { markSavePromptActionDisplayed } from './savePromptActionDisplay';

// FUTURE - Try to check initial inputs list? Probably request to content_script?
/**
* How often the tab is checked for the end of loading before the prompt is shown.
* @type {number}
*/
const TAB_STATUS_POLL_MS = 25;

/**
* Function to remove the input data a login request used. Values captured after the request started belong to the next
* page (e.g. a login form rendered again with the username pre-filled) and stay, so the next submit can still be
* recognised. Without a request time, all input data of the tab is removed.
* @async
* @param {string} tabId - The ID of the tab.
* @param {Object} tabsInputData - The input data for all tabs.
* @param {number} [requestTime] - The time the login request started, in milliseconds.
* @return {Promise<void>} A promise that resolves when the operation is complete.
*/
const removePreviousAndCurrentTabInputData = async (tabId, tabsInputData, requestTime) => {
  if (tabsInputData[tabId]) {
    const tabInputs = tabsInputData[tabId];
    tabsInputData[tabId] = {};

    if (typeof requestTime === 'number') {
      Object.keys(tabInputs).forEach(id => {
        if (typeof tabInputs[id]?.timestamp === 'number' && tabInputs[id].timestamp > requestTime) {
          tabsInputData[tabId][id] = tabInputs[id];
        }
      });
    }
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
* @param {string} serviceTypeData - The type of service for the save prompt.
* @param {Object} tabsInputData - The input data for all tabs.
* @param {Object} values - The values to save in the prompt.
* @param {Array} savePromptActions - The actions to save the prompt.
* @return {Promise<void>} A promise that resolves when the save prompt action is complete.
*/
const savePromptAction = async (details, serviceTypeData, tabsInputData, values, savePromptActions) => {
  let tabData;
  
  try {
    tabData = await browser.tabs.get(details?.tabId);
  } catch {
    return;
  }
  
  while (tabData?.status !== 'complete') {
    await new Promise(resolve => setTimeout(resolve, TAB_STATUS_POLL_MS));

    try {
      tabData = await browser.tabs.get(details?.tabId);
    } catch {
      break;
    }
  }

  await injectCSIfNotAlready(details?.tabId, REQUEST_TARGETS.CONTENT);
  await removePreviousAndCurrentTabInputData(details.tabId, tabsInputData, details?.timeStamp);

  const storageKey = `session:savePromptContext-${details.tabId}`;

  await storage.setItem(storageKey, JSON.stringify({
    tabId: details.tabId,
    url: getPageUrl(details, tabData?.url),
    tabUrl: tabData?.url,
    values
  }));

  logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - savePromptAction');

  const displayed = await sendSavePromptToTab(details.tabId, serviceTypeData, storageKey);

  if (displayed) {
    markSavePromptActionDisplayed(details.tabId, savePromptActions);
  }
};

export default savePromptAction;
