// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { AUTOFILL_RESULT_CODES } from '@/constants';
import { sendMessageToAllFrames, sendMessageToTab, loadAndClassifyCrossDomainPermissions } from '@/partials/functions';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import TwofasNotification from '@/partials/TwofasNotification';
import openPopupWithFallback from './openPopupWithFallback';
import restoreActionDataPassword from './restoreActionDataPassword';

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

  logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - handleAutofillWithPermission (storeAutofillFailureData)');
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

  try {
    const reinjected = await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);

    if (!reinjected) {
      logger.warn(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'handleAutofillWithPermission - re-injection did not verify all frames', { tabId });
    }
  } catch (e) {
    await CatchError(e);
  }

  let response;

  try {
    response = await sendMessageToAllFrames(tabId, actionData);
  } catch (e) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'handleAutofillWithPermission - sendMessageToAllFrames threw', { tabId, errorMessage: e?.message });
    await CatchError(e);
    await storage.removeItem(storageKey);
    await storeAutofillFailureData(tabId, closeData);

    return openPopupWithFallback();
  }

  await storage.removeItem(storageKey);

  if (!response) {
    await storeAutofillFailureData(tabId, closeData);

    return openPopupWithFallback();
  }

  const isOk = response.some(frameResponse => frameResponse.status === 'ok');
  const allFieldsFilled = response.every(frameResponse => {
    if (frameResponse.status !== 'ok') {
      return frameResponse.code === AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS;
    }

    const couldFillUsername = !actionData.username || frameResponse.canAutofillUsername !== false;
    const couldFillPassword = !actionData.password || frameResponse.canAutofillPassword !== false;

    return couldFillUsername && couldFillPassword;
  });

  if (!isOk) {
    await storeAutofillFailureData(tabId, closeData);

    return openPopupWithFallback();
  }

  if (!allFieldsFilled && closeData) {
    if (closeData.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await storeAutofillFailureData(tabId, closeData);

      return openPopupWithFallback();
    }
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
