// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';

/**
* Function to handle tab removal in the browser.
* Cleans up tab data from memory and session storage for garbage collection.
* @param {number} tabId - The ID of the tab that was removed.
* @param {Object} tabsInputData - The current state of the tabs.
* @param {Array} savePromptActions - An array of pending save prompt actions.
* @return {void}
*/
const onTabRemoved = async (tabId, tabsInputData, savePromptActions) => {
  logger.debug(LOGGER_CONSTANTS.CATEGORIES.BACKGROUND, 'TabHandler - tab removed', { tabId });

  if (tabsInputData[tabId]) {
    delete tabsInputData[tabId];
  }

  if (savePromptActions && Array.isArray(savePromptActions)) {
    const actionIndex = savePromptActions.findIndex(a => a.tabId === tabId);

    if (actionIndex !== -1) {
      savePromptActions.splice(actionIndex, 1);
    }
  }

  await storage.removeItem(`session:savePromptSuppressed-${tabId}`);
  await storage.removeItem(`session:savePromptContext-${tabId}`);
  // Pending cross-domain autofill payloads hold encrypted credentials/card data; clear
  // them when the tab is destroyed so they do not outlive the tab if a dialog is abandoned.
  await storage.removeItem(`session:autofillData-${tabId}`);
  await storage.removeItem(`session:autofillCardData-${tabId}`);
  await storage.removeItem(`session:autofillT2FailedPending-${tabId}`);
  // Pending notification fallback (shown in the popup when no native notifications channel
  // exists, e.g. Safari); clear it so a notification queued for the popup does not outlive
  // the tab it was meant for.
  await storage.removeItem(`session:notificationPending-${tabId}`);

  logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - onTabRemoved');

  try {
    const popupStateKey = await getKey('popup_state');
    const storageKey = `session:${popupStateKey}`;
    const currentStorage = await storage.getItem(storageKey);

    if (currentStorage?.[tabId]) {
      delete currentStorage[tabId];
      await storage.setItem(storageKey, currentStorage);
    }
  } catch (e) {
    CatchError(e);
  }
};

export default onTabRemoved;
