// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab, aggregateCardAutofillResponses, loadAndClassifyCrossDomainPermissions, focusTabForDialog } from '@/partials/functions';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import TwofasNotification from '@/partials/TwofasNotification';
import restoreCardActionData from './restoreCardActionData';

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

  const { actionData } = storedData;

  if (!actionData) {
    await storage.removeItem(storageKey);

    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  const { unknownDomains, crossDomainAllowedDomains } = await loadAndClassifyCrossDomainPermissions(domains);

  if (unknownDomains.length > 0) {
    storedData.trustedDomains = crossDomainAllowedDomains;
    await storage.setItem(storageKey, JSON.stringify(storedData));

    await focusTabForDialog(tabId);

    try {
      await sendMessageToTab(tabId, {
        action: REQUEST_ACTIONS.SHOW_CROSS_DOMAIN_CONFIRM,
        target: REQUEST_TARGETS.CONTENT,
        unknownDomains,
        storageKey,
        theme: await storage.getItem('local:theme')
      });
    } catch (e) {
      await CatchError(e);
      await storage.removeItem(storageKey);
    }

    return;
  }

  actionData.iframePermissionGranted = true;
  actionData.crossDomainAllowedDomains = crossDomainAllowedDomains;

  // Unwrap the at-rest-encrypted card fields back to plaintext before filling (finding #5).
  // No-op when crypto is available (the page decrypts them itself).
  const restored = await restoreCardActionData(actionData);

  if (restored.status !== 'ok') {
    await storage.removeItem(storageKey);

    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  try {
    const reinjected = await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);

    if (!reinjected) {
      logger.warn(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'handleAutofillCardWithPermission - re-injection did not verify all frames', { tabId });
    }
  } catch (e) {
    await CatchError(e);
  }

  let response;

  try {
    response = await sendMessageToAllFrames(tabId, actionData);
  } catch (e) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'handleAutofillCardWithPermission - sendMessageToAllFrames threw', { tabId, errorMessage: e?.message });
    await CatchError(e);
    await storage.removeItem(storageKey);

    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  await storage.removeItem(storageKey);

  if (!response) {
    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  const { outcome } = aggregateCardAutofillResponses(response);

  if (outcome === 'noInputs') {
    return TwofasNotification.show({
      Title: getMessage('notification_card_autofill_no_inputs_title'),
      Message: getMessage('notification_card_autofill_no_inputs_message')
    }, tabId, true);
  }

  if (outcome === 'error') {
    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  if (outcome === 'partial') {
    return TwofasNotification.show({
      Title: getMessage('notification_card_autofill_partial_title'),
      Message: getMessage('notification_card_autofill_partial_message')
    }, tabId, true);
  }
};

export default handleAutofillCardWithPermission;
