// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import addNewSessionIdToDevice from './utils/addNewSessionIdToDevice';
import TwoFasWebSocket from '@/partials/WebSocket';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import closeWindowIfNotInSeparateWindow from '../functions/closeWindowIfNotInSeparateWindow';

/** 
* Handles the close signal for the pull request action.
* @param {string} newSessionId - The new session ID.
* @param {string} uuid - The unique identifier for the user.
* @param {Object} closeData - The data related to the close action.
* @param {Function} navigate - The navigation function.
* @return {Promise<void>} 
*/
const handleCloseSignalPullRequestAction = async (newSessionId, uuid, closeData, navigate) => {
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
      const separateWindow = await popupIsInSeparateWindow();
      await closeWindowIfNotInSeparateWindow(separateWindow);

      if (separateWindow || (!window || typeof window?.close !== 'function' || import.meta.env.BROWSER === 'safari')) {
        showToast(browser.i18n.getMessage('this_tab_autofill_success'), 'success');
        navigate('/');
      }
    } else {
      const toastId = showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2_failed'), 'info', false);

      navigate('/', {
        state: {
          action: 'autofillT2Failed',
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
    navigate(closeData.returnUrl);
  }

  if (closeData?.returnToast) {
    setTimeout(() => {
      showToast(closeData.returnToast.text, closeData.returnToast.type || 'info');
    }, 200);
  }

  return true;
};

export default handleCloseSignalPullRequestAction;
