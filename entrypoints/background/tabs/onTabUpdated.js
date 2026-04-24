// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendDomainToPopupWindow, sendSavePromptToTab, removeSavePromptAction, checkDomainOnIgnoredList, getRootDomain, setBadgeLocked, setBadgeIcon, setBadgeText } from '../utils';
import isTabIsPopupWindow from './isTabIsPopupWindow';
import updateNoAccountItem from '../contextMenu/updateNoAccountItem';
import checkPromptCS from '@/partials/contentScript/checkPromptCS';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
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
      await storage.removeItem(`session:savePromptSuppressed-${tabID}`);
    }

    let items;

    try {
      items = await getItems();
    } catch {}

    await Promise.all([
      setBadgeText(configured, items, tab.url, tabID).catch(e => CatchError(e)),
      sendDomainToPopupWindow(tabID).catch(() => {}),
      updateNoAccountItem(tabID, items).catch(() => {}),
      checkPromptCS(tabID).catch(() => {})
    ]);

    const action = savePromptActions.filter(a => a.tabId === tabID)[0];

    if (action && !tabUpdateData[tabID].savePromptVisible) {
      const storageSavePrompt = await storage.getItem('local:savePrompt');

      if (storageSavePrompt && storageSavePrompt !== 'default' && storageSavePrompt !== 'default_encrypted') {
        removeSavePromptAction(tabID, action.url, savePromptActions);
        return;
      }

      const tabUrlIgnored = await checkDomainOnIgnoredList(tab.url);
      const requestUrlIgnored = action?.url ? await checkDomainOnIgnoredList(action.url) : false;

      if (tabUrlIgnored || requestUrlIgnored) {
        removeSavePromptAction(tabID, action.url, savePromptActions);
        return;
      }

      tabUpdateData[tabID].savePromptVisible = true;

      await injectCSIfNotAlready(tabID, REQUEST_TARGETS.CONTENT).catch(() => {});

      let actionDomain = null;
      let tabDomain = null;

      try {
        actionDomain = getRootDomain(new URL(action.url).hostname);
        tabDomain = getRootDomain(new URL(tab.url).hostname);
      } catch {
        removeSavePromptAction(tabID, action.url, savePromptActions);
        return;
      }

      if (actionDomain !== tabDomain) {
        removeSavePromptAction(tabID, action.url, savePromptActions);
        return;
      }

      const storageKey = `session:savePromptContext-${tabID}`;
      const existingContext = await storage.getItem(storageKey);

      if (!existingContext) {
        await storage.setItem(storageKey, JSON.stringify({
          tabId: tabID,
          url: action.url,
          tabUrl: action.tabUrl || tab.url,
          values: {
            username: action.username,
            password: action.password,
            encrypted: action.encrypted || false
          }
        }));
      }

      await sendSavePromptToTab(tabID, action.serviceTypeData, storageKey);
    }          
  } catch (e) {
    await CatchError(e);
  }
};

export default onTabUpdated;
