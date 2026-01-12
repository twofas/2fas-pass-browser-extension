// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab } from '@/partials/functions';
import TwofasNotification from '@/partials/TwofasNotification';

/**
* Handles Login autofill with cross-domain permission confirmation.
* @async
* @param {number} tabId - The ID of the tab to autofill.
* @param {string} storageKey - The session storage key where actionData is stored.
* @param {Array<string>} domains - The list of cross-domain hostnames requiring permission.
* @return {Promise<void>}
*/
const handleAutofillWithPermission = async (tabId, storageKey, domains) => {
  let storedData;

  try {
    const storedDataJson = await storage.getItem(storageKey);

    if (!storedDataJson) {
      return TwofasNotification.show({
        Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
        Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
      }, tabId, true);
    }

    storedData = JSON.parse(storedDataJson);
  } catch (e) {
    await CatchError(e);

    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  const { actionData } = storedData;

  if (!actionData) {
    await storage.removeItem(storageKey);

    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  const confirmMessage = browser.i18n.getMessage('autofill_cross_domain_warning_popup')
    .replace('DOMAINS', domains.join(', '));

  // Focus the tab before showing confirmation dialog
  // window.confirm() requires the tab to be active/focused to show the dialog
  try {
    const tab = await browser.tabs.get(tabId);

    await browser.windows.update(tab.windowId, { focused: true });
    await browser.tabs.update(tabId, { active: true });

    // Small delay to ensure tab is fully focused before showing dialog
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch { }

  let confirmResult;

  try {
    confirmResult = await sendMessageToTab(tabId, {
      action: REQUEST_ACTIONS.SHOW_CROSS_DOMAIN_CONFIRM,
      target: REQUEST_TARGETS.CONTENT,
      message: confirmMessage
    });
  } catch (e) {
    await CatchError(e);
    await storage.removeItem(storageKey);
    return;
  }

  if (confirmResult?.status !== 'ok' || !confirmResult?.confirmed) {
    await storage.removeItem(storageKey);
    return;
  }

  actionData.iframePermissionGranted = true;

  let response;

  try {
    response = await sendMessageToAllFrames(tabId, actionData);
  } catch (e) {
    await CatchError(e);
    await storage.removeItem(storageKey);

    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  await storage.removeItem(storageKey);

  if (!response) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  const isOk = response.some(frameResponse => frameResponse.status === 'ok');

  if (!isOk) {
    const allNoInputs = response.every(frameResponse => frameResponse.status === 'error' && frameResponse.message === 'No input fields found');

    if (allNoInputs) {
      return TwofasNotification.show({
        Title: browser.i18n.getMessage('notification_shortcut_autofill_no_username_and_password_title'),
        Message: browser.i18n.getMessage('notification_shortcut_autofill_no_username_and_password_message')
      }, tabId, true);
    }

    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  try {
    await sendMessageToAllFrames(tabId, {
      action: REQUEST_ACTIONS.IGNORE_SAVE_PROMPT,
      target: REQUEST_TARGETS.PROMPT
    });
  } catch { }

  try {
    await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.IGNORE_SAVE_PROMPT,
      target: REQUEST_TARGETS.BACKGROUND_PROMPT,
      tabId
    });
  } catch { }
};

export default handleAutofillWithPermission;
