// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import addNewSessionIdToDevice from './utils/addNewSessionIdToDevice';
import TwoFasWebSocket from '@/partials/WebSocket';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import closeWindowIfNotInSeparateWindow from '../functions/closeWindowIfNotInSeparateWindow';
import sendMessageToAllFrames from '../functions/sendMessageToAllFrames';

/** 
* Handles the close signal for the pull request action.
* @param {string} newSessionId - The new session ID.
* @param {string} uuid - The unique identifier for the user.
* @param {Object} closeData - The data related to the close action.
* @param {Object} state - The current state of fetch action.
* @return {Promise<void>} 
*/
const handleCloseSignalPullRequestAction = async (newSessionId, uuid, closeData, state) => {
  await addNewSessionIdToDevice(uuid, newSessionId); // FUTURE - Change to deviceId instead of uuid?

  try {
    const socket = TwoFasWebSocket.getInstance();
    socket.close();
  } catch {}

  if (closeData?.windowClose && window && typeof window?.close === 'function' && import.meta.env.BROWSER !== 'safari') {
    return window.close();
  }

  if (closeData?.action === 'autofill') {
    const autofillRes = closeData.autofillRes;
    const isOk = autofillRes.filter(frameResponse => frameResponse.status === 'ok').length > 0;

    if (isOk) {
      try {
        await sendMessageToAllFrames(state.data.tabId, {
          action: REQUEST_ACTIONS.IGNORE_SAVE_PROMPT,
          target: REQUEST_TARGETS.PROMPT
        });
      } catch {}

      try {
        await browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.IGNORE_SAVE_PROMPT,
          target: REQUEST_TARGETS.BACKGROUND_PROMPT,
          tabId: state.data.tabId
        });
      } catch {}

      const separateWindow = await popupIsInSeparateWindow();
      await closeWindowIfNotInSeparateWindow(separateWindow);

      if (separateWindow || (!window || typeof window?.close !== 'function' || import.meta.env.BROWSER === 'safari')) {
        showToast(browser.i18n.getMessage('this_tab_autofill_success'), 'success');
        eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, '/');
      }
    } else {
      const toastId = showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2_failed'), 'info', false);

      eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, '/', {
        state: {
          action: 'autofillT2Failed', // Non-fetch action here
          loginId: closeData.loginId,
          deviceId: closeData.deviceId,
          password: closeData.password,
          hkdfSaltAB: closeData.hkdfSaltAB,
          sessionKeyForHKDF: closeData.sessionKeyForHKDF,
          toastId
        }
      });
    }
  }

  if (closeData?.returnUrl) {
    eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, closeData.returnUrl);
  }

  if (closeData?.returnToast) {
    setTimeout(() => {
      showToast(closeData.returnToast.text, closeData.returnToast.type || 'info');
    }, 200);
  }

  return true;
};

export default handleCloseSignalPullRequestAction;
