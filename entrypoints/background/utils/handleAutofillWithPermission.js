// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToTab, loadAndClassifyCrossDomainPermissions } from '@/partials/functions';
import TwofasNotification from '@/partials/TwofasNotification';
import restoreActionDataPassword from './restoreActionDataPassword';
import dispatchLoginAutofill from './dispatchLoginAutofill';

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

  const { unknownDomains, crossDomainAllowedDomains } = await loadAndClassifyCrossDomainPermissions(domains);

  if (unknownDomains.length > 0) {
    storedData.trustedDomains = crossDomainAllowedDomains;
    await storage.setItem(storageKey, JSON.stringify(storedData));
    logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - handleAutofillWithPermission (trustedDomains update)');

    try {
      const tab = await browser.tabs.get(tabId);

      await browser.windows.update(tab.windowId, { focused: true });
      await browser.tabs.update(tabId, { active: true });

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch { }

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

  // Unwrap the at-rest-encrypted password back to plaintext before filling (finding #5).
  // No-op when crypto is available (the page decrypts it itself).
  const restored = await restoreActionDataPassword(actionData);

  if (restored.status !== 'ok') {
    await storage.removeItem(storageKey);

    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  return dispatchLoginAutofill(tabId, storageKey, actionData, closeData);
};

export default handleAutofillWithPermission;
