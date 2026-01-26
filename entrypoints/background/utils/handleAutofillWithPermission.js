// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab } from '@/partials/functions';
import TwofasNotification from '@/partials/TwofasNotification';

/**
* Stores autofill failure data for KeepItem display when popup reopens.
* @async
* @param {number} tabId - The ID of the tab.
* @param {Object} closeData - The close data containing item and SIF info.
* @return {Promise<void>}
*/
const storeAutofillFailureData = async (tabId, closeData) => {
  if (!closeData) {
    return;
  }

  const failureKey = `session:autofillT2FailedPending-${tabId}`;

  await storage.setItem(failureKey, JSON.stringify({
    action: 'autofillT2Failed',
    vaultId: closeData.vaultId,
    deviceId: closeData.deviceId,
    itemId: closeData.itemId,
    s_password: closeData.s_password,
    hkdfSaltAB: closeData.hkdfSaltAB,
    sessionKeyForHKDF: closeData.sessionKeyForHKDF
  }));
};

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
        Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
        Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
      }, tabId, true);
    }

    storedData = JSON.parse(storedDataJson);
  } catch (e) {
    await CatchError(e);

    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  const { actionData, closeData } = storedData;

  if (!actionData) {
    await storage.removeItem(storageKey);

    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  // Check if all domains are in the trusted domains list
  const trustedDomains = await storage.getItem('local:crossDomainTrustedDomains') || [];
  const allDomainsTrusted = domains.every(domain => trustedDomains.includes(domain));

  let confirmResult;

  if (!allDomainsTrusted) {
    const confirmMessage = getMessage('autofill_cross_domain_warning_popup')
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
  }

  actionData.iframePermissionGranted = true;

  let response;

  try {
    response = await sendMessageToAllFrames(tabId, actionData);
  } catch (e) {
    await CatchError(e);
    await storage.removeItem(storageKey);
    await storeAutofillFailureData(tabId, closeData);

    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_autofill_failed_open_popup')
    }, tabId, true);
  }

  await storage.removeItem(storageKey);

  if (!response) {
    await storeAutofillFailureData(tabId, closeData);

    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_autofill_failed_open_popup')
    }, tabId, true);
  }

  const isOk = response.some(frameResponse => frameResponse.status === 'ok');
  const allFieldsFilled = response.every(frameResponse => {
    if (frameResponse.status !== 'ok') {
      return frameResponse.message === 'No input fields found';
    }

    const couldFillUsername = !actionData.username || frameResponse.canAutofillUsername !== false;
    const couldFillPassword = !actionData.password || frameResponse.canAutofillPassword !== false;

    return couldFillUsername && couldFillPassword;
  });

  if (!isOk) {
    await storeAutofillFailureData(tabId, closeData);

    return TwofasNotification.show({
      Title: getMessage('notification_shortcut_autofill_no_username_and_password_title'),
      Message: getMessage('notification_autofill_failed_open_popup')
    }, tabId, true);
  }

  if (!allFieldsFilled && closeData) {
    await storeAutofillFailureData(tabId, closeData);

    return TwofasNotification.show({
      Title: getMessage('notification_autofill_partial_title'),
      Message: getMessage('notification_autofill_failed_open_popup')
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
