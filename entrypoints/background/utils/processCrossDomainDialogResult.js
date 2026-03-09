// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, saveCrossDomainPreferences, openPopup } from '@/partials/functions';
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
* Handles Login autofill after cross-domain dialog result.
* @async
* @param {number} tabId - The ID of the tab.
* @param {string} storageKey - The session storage key.
* @param {Object} actionData - The autofill action data.
* @param {Object} closeData - The close data for failure recovery.
* @param {Array<string>} crossDomainAllowedDomains - Allowed domains list.
* @return {Promise<void>}
*/
const processLoginResult = async (tabId, storageKey, actionData, closeData, crossDomainAllowedDomains) => {
  actionData.iframePermissionGranted = true;
  actionData.crossDomainAllowedDomains = crossDomainAllowedDomains;

  let response;

  try {
    response = await sendMessageToAllFrames(tabId, actionData);
  } catch (e) {
    await CatchError(e);
    await storage.removeItem(storageKey);
    await storeAutofillFailureData(tabId, closeData);

    return openPopup();
  }

  await storage.removeItem(storageKey);

  if (!response) {
    await storeAutofillFailureData(tabId, closeData);

    return openPopup();
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

    return openPopup();
  }

  if (!allFieldsFilled && closeData) {
    if (closeData.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await storeAutofillFailureData(tabId, closeData);

      return openPopup();
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

/**
* Handles Card autofill after cross-domain dialog result.
* @async
* @param {number} tabId - The ID of the tab.
* @param {string} storageKey - The session storage key.
* @param {Object} actionData - The autofill action data.
* @param {Array<string>} crossDomainAllowedDomains - Allowed domains list.
* @return {Promise<void>}
*/
const processCardResult = async (tabId, storageKey, actionData, crossDomainAllowedDomains) => {
  actionData.iframePermissionGranted = true;
  actionData.crossDomainAllowedDomains = crossDomainAllowedDomains;

  let response;

  try {
    response = await sendMessageToAllFrames(tabId, actionData);
  } catch (e) {
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

  const relevantResponses = response.filter(r => r && r.status && r.message !== 'No input fields found') || [];

  if (relevantResponses.length === 0) {
    return TwofasNotification.show({
      Title: getMessage('notification_card_autofill_no_inputs_title'),
      Message: getMessage('notification_card_autofill_no_inputs_message')
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
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  if (isOk && !isPartial && !hasMissingInputs) {
    return;
  }

  if (isPartial || hasMissingInputs) {
    return TwofasNotification.show({
      Title: getMessage('notification_card_autofill_partial_title'),
      Message: getMessage('notification_card_autofill_partial_message')
    }, tabId, true);
  }
};

/**
* Processes the cross-domain dialog result sent from the content script.
* This handles the case where the service worker may have been terminated
* while the user was interacting with the dialog.
* @async
* @param {Object} request - The dialog result from the content script.
* @param {string} request.storageKey - The session storage key for autofill data.
* @param {boolean} request.confirmed - Whether the user confirmed.
* @param {Object} request.domainPreferences - The user's domain preferences.
* @param {Array<string>} request.allowedDomains - Domains the user allowed.
* @return {Promise<void>}
*/
const processCrossDomainDialogResult = async request => {
  const { storageKey, confirmed, domainPreferences, allowedDomains } = request;

  if (!storageKey) {
    return;
  }

  if (!confirmed) {
    await storage.removeItem(storageKey);
    return;
  }

  let storedData;

  try {
    const storedDataJson = await storage.getItem(storageKey);

    if (!storedDataJson) {
      return;
    }

    storedData = JSON.parse(storedDataJson);
  } catch (e) {
    await CatchError(e);
    return;
  }

  const { actionData, closeData, trustedDomains } = storedData;

  if (!actionData) {
    await storage.removeItem(storageKey);
    return;
  }

  const tabIdMatch = storageKey.match(/-(\d+)$/);

  if (!tabIdMatch) {
    await storage.removeItem(storageKey);
    return;
  }

  const tabId = parseInt(tabIdMatch[1], 10);

  await saveCrossDomainPreferences(domainPreferences);

  const crossDomainAllowedDomains = [...(trustedDomains || []), ...(allowedDomains || [])];
  const isCard = actionData.action === REQUEST_ACTIONS.AUTOFILL_CARD;

  if (isCard) {
    return processCardResult(tabId, storageKey, actionData, crossDomainAllowedDomains);
  }

  return processLoginResult(tabId, storageKey, actionData, closeData, crossDomainAllowedDomains);
};

export default processCrossDomainDialogResult;
