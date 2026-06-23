// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, aggregateLoginAutofillResponses } from '@/partials/functions';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import openPopupWithFallback from './openPopupWithFallback';
import storeAutofillFailureData from './storeAutofillFailureData';
import { finishLoginAutofill } from '../websocket/utils/finishPullRequestAutofill.js';

/**
* Dispatches a fully-prepared Login autofill to all frames and interprets the result.
* Shared by the popup-permission path (handleAutofillWithPermission) and the
* post-dialog path (processCrossDomainDialogResult → processLoginResult), so the
* re-injection, transmission, response evaluation and failure escalation live in
* a single place (finding #22).
*
* The actionData passed in must already be fully prepared by the caller:
* iframePermissionGranted set, crossDomainAllowedDomains set, and any at-rest
* password unwrapped back to plaintext.
*
* When closeData.windowClose is set (shortcut-initiated flow) completion is
* delegated to finishLoginAutofill; otherwise failures escalate to
* storeAutofillFailureData + openPopupWithFallback (popup reopen with KeepItem).
* @async
* @param {number} tabId - The ID of the tab to autofill.
* @param {string} storageKey - The session storage key holding the autofill data.
* @param {Object} actionData - The fully-prepared autofill action data.
* @param {Object} closeData - The close data for failure recovery (may carry windowClose).
* @return {Promise<void>}
*/
const dispatchLoginAutofill = async (tabId, storageKey, actionData, closeData) => {
  try {
    const reinjected = await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);

    if (!reinjected) {
      logger.warn(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'dispatchLoginAutofill - re-injection did not verify all frames', { tabId });
    }
  } catch (e) {
    await CatchError(e);
  }

  let response;

  try {
    response = await sendMessageToAllFrames(tabId, actionData);
  } catch (e) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'dispatchLoginAutofill - sendMessageToAllFrames threw', { tabId, errorMessage: e?.message });
    await CatchError(e);
    await storage.removeItem(storageKey);

    if (closeData?.windowClose) {
      return finishLoginAutofill(tabId, actionData, closeData, false);
    }

    await storeAutofillFailureData(tabId, closeData);

    return openPopupWithFallback();
  }

  await storage.removeItem(storageKey);

  if (closeData?.windowClose) {
    return finishLoginAutofill(tabId, actionData, closeData, response);
  }

  if (!response) {
    await storeAutofillFailureData(tabId, closeData);

    return openPopupWithFallback();
  }

  const { isOk, allFieldsFilled } = aggregateLoginAutofillResponses(response, actionData);

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

export default dispatchLoginAutofill;
