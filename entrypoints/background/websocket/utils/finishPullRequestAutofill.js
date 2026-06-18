// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { AUTOFILL_RESULT_CODES } from '@/constants';
import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import aggregateCardAutofillResponses from '@/partials/functions/aggregateCardAutofillResponses';
import wsNotify from '../wsNotify.js';

/**
* Closes the popup window opened for a shortcut-initiated (windowClose) flow.
* @async
* @return {Promise<void>}
*/
const closePopupWindow = async () => {
  try {
    const extURL = browser.runtime.getURL('/popup.html');
    const popupTabs = await browser.tabs.query({ url: extURL });

    if (popupTabs?.length > 0) {
      await browser.windows.remove(popupTabs[0].windowId);
    }
  } catch { }
};

/**
* Focuses the popup window opened for a shortcut-initiated (windowClose) flow.
* Internal helper — the popup/UI code uses @/partials/functions/focusPopupWindow instead.
* @async
* @return {Promise<void>}
*/
const focusPopupWindow = async () => {
  try {
    const extURL = browser.runtime.getURL('/popup.html');
    const popupTabs = await browser.tabs.query({ url: extURL });

    if (popupTabs?.length > 0) {
      await browser.windows.update(popupTabs[0].windowId, { focused: true });
    }
  } catch { }
};

/**
* Finishes a Login autofill initiated through the pull-request (SIF fetch) flow,
* notifying the connected popup of the result and managing the popup window.
* Handles both the shortcut-initiated path (closeData.windowClose) and the
* in-popup path.
* @async
* @param {number} tabId - The ID of the tab.
* @param {Object} actionData - The autofill action data sent to the frames.
* @param {Object} closeData - The close data (SIF + windowClose flag) for recovery.
* @param {Array<Object>|false} autofillRes - Per-frame autofill responses, or false on failure.
* @return {Promise<boolean>}
*/
const finishLoginAutofill = async (tabId, actionData, closeData, autofillRes) => {
  if (!Array.isArray(autofillRes)) {
    if (closeData.windowClose) {
      await focusPopupWindow();
    }

    const toastId = crypto.randomUUID();

    wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info', autoClose: false, toastId });

    wsNotify('navigate', {
      path: '/',
      options: {
        state: {
          action: 'autofillT2Failed',
          vaultId: closeData.vaultId,
          deviceId: closeData.deviceId,
          itemId: closeData.itemId,
          s_password: closeData.s_password,
          encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64,
          toastId
        }
      }
    });

    return true;
  }

  const isOk = autofillRes.some(frameResponse => frameResponse.status === 'ok');
  const allFieldsFilled = autofillRes.every(frameResponse => {
    if (frameResponse.status !== 'ok') {
      return frameResponse.code === AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS;
    }

    const couldFillUsername = !actionData.username || frameResponse.canAutofillUsername !== false;
    const couldFillPassword = !actionData.password || frameResponse.canAutofillPassword !== false;

    return couldFillUsername && couldFillPassword;
  });

  if (isOk) {
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

    if (!allFieldsFilled) {
      // Focus popup window when showing KeepItem for shortcut-initiated autofill
      if (closeData.windowClose) {
        await focusPopupWindow();
      }

      const toastId = crypto.randomUUID();

      wsNotify('toast', { message: getMessage('this_tab_autofill_partial'), type: 'info', autoClose: false, toastId });

      wsNotify('navigate', {
        path: '/',
        options: {
          state: {
            action: 'autofillT2Failed',
            vaultId: closeData.vaultId,
            deviceId: closeData.deviceId,
            itemId: closeData.itemId,
            s_password: closeData.s_password,
            encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64,
            toastId
          }
        }
      });

      return true;
    }

    // For shortcut-initiated autofill, close the window after success
    if (closeData.windowClose) {
      await closePopupWindow();
      return true;
    }

    const separateWindow = await popupIsInSeparateWindow();

    if (!separateWindow) {
      await closePopupWindow();
    }

    // In background context, always notify popup (it may be in a separate window or Safari)
    wsNotify('toast', { message: getMessage('this_tab_autofill_success'), type: 'success' });
    wsNotify('navigate', { path: '/' });

    return true;
  }

  // Focus popup window when showing KeepItem for shortcut-initiated autofill
  if (closeData.windowClose) {
    await focusPopupWindow();
  }

  const toastId = crypto.randomUUID();

  wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info', autoClose: false, toastId });

  wsNotify('navigate', {
    path: '/',
    options: {
      state: {
        action: 'autofillT2Failed',
        vaultId: closeData.vaultId,
        deviceId: closeData.deviceId,
        itemId: closeData.itemId,
        s_password: closeData.s_password,
        encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64,
        toastId
      }
    }
  });

  return true;
};

/**
* Finishes a PaymentCard autofill initiated through the pull-request (SIF fetch)
* flow, notifying the connected popup of the result and managing the popup window.
* Handles both the shortcut-initiated path (closeData.windowClose) and the
* in-popup path.
* @async
* @param {number} tabId - The ID of the tab.
* @param {Object} actionData - The autofill action data sent to the frames.
* @param {Object} closeData - The close data (SIF + windowClose flag) for recovery.
* @param {Array<Object>|false} autofillRes - Per-frame autofill responses, or false on failure.
* @return {Promise<boolean>}
*/
const finishCardAutofill = async (tabId, actionData, closeData, autofillRes) => {
  if (!Array.isArray(autofillRes)) {
    if (closeData.windowClose) {
      await focusPopupWindow();
    }

    const toastId = crypto.randomUUID();

    wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info', autoClose: false, toastId });

    wsNotify('navigate', {
      path: '/',
      options: {
        state: {
          action: 'autofillCardT2Failed',
          vaultId: closeData.vaultId,
          deviceId: closeData.deviceId,
          itemId: closeData.itemId,
          s_cardNumber: closeData.s_cardNumber,
          s_expirationDate: closeData.s_expirationDate,
          s_securityCode: closeData.s_securityCode,
          encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64,
          toastId
        }
      }
    });

    return true;
  }

  const { isOk, isPartial, hasMissingInputs } = aggregateCardAutofillResponses(autofillRes);

  if (isOk && !isPartial && !hasMissingInputs) {
    // For shortcut-initiated autofill, close the window after success
    if (closeData.windowClose) {
      await closePopupWindow();
      return true;
    }

    const separateWindow = await popupIsInSeparateWindow();

    if (!separateWindow) {
      await closePopupWindow();
    }

    // In background context, always notify popup (it may be in a separate window or Safari)
    wsNotify('toast', { message: getMessage('this_tab_autofill_success'), type: 'success' });
    wsNotify('navigate', { path: '/' });

    return true;
  }

  if (isOk && hasMissingInputs) {
    // Focus popup window when showing KeepItem for shortcut-initiated autofill
    if (closeData.windowClose) {
      await focusPopupWindow();
    }

    const toastId = crypto.randomUUID();

    wsNotify('toast', { message: getMessage('notification_card_autofill_partial_message'), type: 'info', autoClose: false, toastId });

    wsNotify('navigate', {
      path: '/',
      options: {
        state: {
          action: 'autofillCardT2Failed',
          vaultId: closeData.vaultId,
          deviceId: closeData.deviceId,
          itemId: closeData.itemId,
          s_cardNumber: closeData.s_cardNumber,
          s_expirationDate: closeData.s_expirationDate,
          s_securityCode: closeData.s_securityCode,
          encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64,
          toastId
        }
      }
    });

    return true;
  }

  if (isPartial) {
    wsNotify('toast', { message: getMessage('notification_card_autofill_partial_message'), type: 'info' });
    wsNotify('navigate', { path: '/' });

    return true;
  }

  // Focus popup window when showing KeepItem for shortcut-initiated autofill
  if (closeData.windowClose) {
    await focusPopupWindow();
  }

  const toastId = crypto.randomUUID();

  wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info', autoClose: false, toastId });

  wsNotify('navigate', {
    path: '/',
    options: {
      state: {
        action: 'autofillCardT2Failed',
        vaultId: closeData.vaultId,
        deviceId: closeData.deviceId,
        itemId: closeData.itemId,
        s_cardNumber: closeData.s_cardNumber,
        s_expirationDate: closeData.s_expirationDate,
        s_securityCode: closeData.s_securityCode,
        encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64,
        toastId
      }
    }
  });

  return true;
};

export { closePopupWindow, finishLoginAutofill, finishCardAutofill };
