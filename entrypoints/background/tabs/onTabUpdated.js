// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendDomainToPopupWindow, sendSavePromptToTab, removeSavePromptAction, handleSavePromptResponse, setBadgeLocked, setBadgeIcon, setBadgeText } from '../utils';
import isTabIsPopupWindow from './isTabIsPopupWindow';
import updateNoAccountItem from '../contextMenu/updateNoAccountItem';
import checkPromptCS from '@/partials/contentScript/checkPromptCS';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import { parseDomain } from 'parse-domain';
import getItems from '@/partials/sessionStorage/getItems';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

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
  if (!tabID || !changeInfo || !changeInfo?.status) {
    return false;
  }

  tabUpdateData[tabID] = tabUpdateData[tabID] && typeof tabUpdateData[tabID] === 'object' ? tabUpdateData[tabID] : { url: null, savePromptVisible: false };
  
  let configured;

  try {
    configured = await getConfiguredBoolean('configured');

    if (!configured) {
      throw new Error();
    } else {
      await setBadgeIcon(true, tabID).catch(() => {});
    }
  } catch {
    await setBadgeLocked(tabID).catch(() => {});
    return false;
  }

  if (changeInfo?.status !== 'complete') {
    return false;
  }

  let tab;

  try {
    tab = await browser.tabs.get(tabID);

    if (!tab || !tab?.active || !tab?.url || tab?.url === 'about:blank') {
      return false;
    }
  } catch {
    return false;
  }

  let pw = false;
  
  try {
    pw = await isTabIsPopupWindow(tabID);
  } catch {}

  if (pw) {
    return true;
  }
  
  try {
    if (tab.url && (!tabUpdateData[tabID].url || tabUpdateData[tabID].url !== tab.url)) {
      tabUpdateData[tabID].url = tab.url;
      tabUpdateData[tabID].savePromptVisible = false;
    }

    let items;

    try {
      items = await getItems();
    } catch {}

    await Promise.all([
      setBadgeText(configured, items, tab.url, tabID).catch(e => CatchError(e)),
      sendDomainToPopupWindow(tabID),
      updateNoAccountItem(tabID, items),
      checkPromptCS(tabID)
    ]);

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

      const res = await sendSavePromptToTab(tabID, action.serviceTypeData);
      await handleSavePromptResponse(
        res,
        tabID,
        action.url,
        { username: action.username, password: action.password },
        savePromptActions,
        tabUpdateData
      );
    }          
  } catch (e) {
    await CatchError(e);
  }
};

export default onTabUpdated;
