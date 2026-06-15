// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { tabIsInternal, getLastActiveTab, sendMessageToTab } from '@/partials/functions';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';

/**
* Shows the T2-specific "can't autofill" toast.
* @return {void}
*/
export const showT2Toast = () => {
  showToast(getMessage('this_tab_can_t_autofill_t2'), 'info');
};

/**
* Shows the generic "can't autofill" toast.
* @return {void}
*/
export const showGenericToast = () => {
  showToast(getMessage('this_tab_can_t_autofill'), 'info');
};

/**
* Shared prolog for the popup autofill handlers: resolves the target tab, ensures the
* content script is injected and queries crypto availability from the top frame.
* User-facing toasts and logging on failure are handled here.
* @async
* @param {function} onTabError - Toast callback used when no usable tab is found / injection throws.
* @param {string} logLabel - Label used in log messages (e.g. 'login', 'card').
* @return {Promise<{tab: object, cryptoAvailableRes: object}|null>} Prolog result or null on failure.
*/
export const acquireAutofillTab = async (onTabError, logLabel) => {
  let tab;

  try {
    tab = await getLastActiveTab(onTabError, t => !tabIsInternal(t));
  } catch (e) {
    await CatchError(e);
  }

  if (!tab) {
    logger.warn(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, `Popup-ThisTab - ${logLabel} autofill aborted, no target tab`);
    return null;
  }

  let injected = false;

  try {
    injected = await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT);
  } catch (e) {
    onTabError();

    if (!e.message.includes('showing error page')) {
      await CatchError(e);
    }

    return null;
  }

  if (!injected) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, `Popup-ThisTab - ${logLabel} autofill aborted, content script injection failed`, { tabId: tab.id });
    showToast(getMessage('error_autofill_failed'), 'error');
    return null;
  }

  const cryptoAvailableRes = await sendMessageToTab(tab.id, {
    action: REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE,
    target: REQUEST_TARGETS.CONTENT
  });

  if (!cryptoAvailableRes) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, `Popup-ThisTab - ${logLabel} autofill aborted, no GET_CRYPTO_AVAILABLE response from top frame`, { tabId: tab.id });
    showToast(getMessage('error_autofill_failed'), 'error');
    return null;
  }

  return { tab, cryptoAvailableRes };
};
