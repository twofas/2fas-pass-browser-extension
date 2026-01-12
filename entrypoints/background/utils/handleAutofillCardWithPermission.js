// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab } from '@/partials/functions';
import TwofasNotification from '@/partials/TwofasNotification';

/**
* Handles autofill card with cross-domain permission confirmation.
* @async
* @param {number} tabId - The ID of the tab to autofill.
* @param {string} storageKey - The session storage key where actionData is stored.
* @param {Array<string>} domains - The list of cross-domain hostnames requiring permission.
* @return {Promise<void>}
*/
const handleAutofillCardWithPermission = async (tabId, storageKey, domains) => {
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

  const relevantResponses = response.filter(r => r && r.status && r.message !== 'No input fields found') || [];

  if (relevantResponses.length === 0) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_card_autofill_no_inputs_title'),
      Message: browser.i18n.getMessage('notification_card_autofill_no_inputs_message')
    }, tabId, true);
  }

  const isOk = relevantResponses.some(frameResponse => frameResponse.status === 'ok');
  const isPartial = relevantResponses.some(frameResponse => frameResponse.status === 'partial');

  const allFilledFields = relevantResponses.reduce((acc, r) => {
    if (r.filledFields) {
      Object.keys(r.filledFields).forEach(field => {
        if (r.filledFields[field]) {
          acc[field] = true;
        }
      });
    }

    return acc;
  }, {});

  const allMissingInputFields = relevantResponses
    .flatMap(r => r.missingInputFields || [])
    .filter((field, index, self) => self.indexOf(field) === index)
    .filter(field => !allFilledFields[field]);
  const hasMissingInputs = allMissingInputFields.length > 0;

  if (!isOk && !isPartial) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  if (isOk && !isPartial && !hasMissingInputs) {
    return;
  }

  if (isPartial || hasMissingInputs) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_card_autofill_partial_title'),
      Message: browser.i18n.getMessage('notification_card_autofill_partial_message')
    }, tabId, true);
  }
};

export default handleAutofillCardWithPermission;
