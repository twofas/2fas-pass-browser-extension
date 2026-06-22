// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import aggregateCardAutofillResponses from '@/partials/functions/aggregateCardAutofillResponses';
import aggregateLoginAutofillResponses from '@/partials/functions/aggregateLoginAutofillResponses';
import storeAutofillFailureData from '../../utils/storeAutofillFailureData';
import openPopupWithFallback from '../../utils/openPopupWithFallback';
import wsNotify from '../wsNotify.js';
import { wsState } from '../wsState.js';

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
* Routes a failed/partial Login autofill to the KeepItem recovery screen.
*
* The shortcut-initiated flow (closeData.windowClose) keeps its dedicated popup window open, so the
* result is delivered live over wsNotify (focus + persistent toast + navigation state).
*
* The in-popup flow (non-windowClose) runs entirely in the background service worker. The toolbar
* popup may be CLOSED (the user is approving the pull request on the phone) or still OPEN on the
* /fetch "waiting" screen. Recovery must cover both:
*   • DURABLE — storeAutofillFailureData persists the recovery STATE and openPopupWithFallback
*     reopens a closed popup; useAutofillFailedCheck reads the key when ThisTab mounts.
*   • LIVE — a path-only wsNotify('navigate', { path: '/' }) moves an already-open popup off /fetch
*     and remounts ThisTab so the same durable key is consumed. The navigate carries NO state: an
*     ephemeral navigation state is dropped on reopen (main.jsx applies just the path, Popup.jsx
*     never replays the state), so the state lives solely in the durable key — otherwise an open
*     popup would stay stranded on /fetch and KeepItem would never appear.
* @async
* @param {number} tabId - The ID of the tab.
* @param {Object} closeData - The close data (SIF + windowClose flag) for recovery.
* @param {string} toastMessageKey - i18n key for the live toast (windowClose flow only).
* @return {Promise<void>}
*/
const recoverLoginAutofill = async (tabId, closeData, toastMessageKey) => {
  if (!closeData.windowClose) {
    await storeAutofillFailureData(tabId, closeData);

    // The pull request is complete and the fetch WS is closing, but its 'close' event (which clears
    // wsState.active in bgFetchOnClose) is async and races with the reopen below. A reopened popup
    // whose checkActiveWsAction still sees an active fetch would be forced onto the /fetch route over
    // the KeepItem recovery. Mark the fetch inactive synchronously so the reopen behaves like a
    // normal open and lands on '/' (ThisTab → useAutofillFailedCheck → KeepItem).
    wsState.active = false;
    wsState.type = null;
    wsState.fetchState = null;

    wsNotify('navigate', { path: '/' });
    await openPopupWithFallback();

    return;
  }

  await focusPopupWindow();

  const toastId = crypto.randomUUID();

  wsNotify('toast', { message: getMessage(toastMessageKey), type: 'info', autoClose: false, toastId });

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
    await recoverLoginAutofill(tabId, closeData, 'this_tab_can_t_autofill_t2_failed');

    return true;
  }

  const { isOk, allFieldsFilled } = aggregateLoginAutofillResponses(autofillRes, actionData);

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
      await recoverLoginAutofill(tabId, closeData, 'this_tab_autofill_partial');

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

  await recoverLoginAutofill(tabId, closeData, 'this_tab_can_t_autofill_t2_failed');

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
