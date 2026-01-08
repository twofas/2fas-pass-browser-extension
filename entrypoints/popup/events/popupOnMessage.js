// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { autoClearAction, storageAutoClearActions } from '@/partials/functions';
import tryWindowClose from '@/partials/browserInfo/tryWindowClose';

/**
* Checks if the current popup is running in a separate window.
* @async
* @return {Promise<boolean>} True if popup is in a separate window, false otherwise.
*/
const isCurrentPopupInSeparateWindow = async () => {
  try {
    const tab = await browser?.tabs?.getCurrent();

    if (!tab?.url) {
      return false;
    }

    const extUrl = browser.runtime.getURL('/popup.html');
    return tab.url.includes(extUrl);
  } catch {
    return false;
  }
};

/**
* Focuses the current window if it's a separate popup window.
* @async
* @return {Promise<void>}
*/
const focusCurrentWindow = async () => {
  try {
    const tab = await browser?.tabs?.getCurrent();

    if (tab?.windowId) {
      await browser.windows.update(tab.windowId, { focused: true });
    }
  } catch {}
};

/** 
* Function to handle messages sent to the popup.
* @param {Object} request - The request object.
* @param {Object} sender - The sender object.
* @param {Function} sendResponse - The function to send a response.
* @return {boolean} Indicates if the message was handled.
*/
const popupOnMessage = (request, sender, sendResponse) => {
  try {
    if (!request || !request.action || request.target !== REQUEST_TARGETS.POPUP) {
      return false;
    }

    switch (request.action) {
      case REQUEST_ACTIONS.AUTO_CLEAR_ACTION: {
        if (import.meta.env.BROWSER !== 'safari') {
          autoClearAction(request).finally(sendResponse);
        } else {
          sendResponse({ status: 'ok' });
        }

        break;
      }

      case REQUEST_ACTIONS.FOCUS_CHECK: {
        if (document?.hasFocus()) {
          storageAutoClearActions().finally(() => sendResponse({ status: 'ok' }));
        } else {
          sendResponse({ status: 'ok' });
        }

        break;
      }

      case REQUEST_ACTIONS.NEW_POPUP: {
        isCurrentPopupInSeparateWindow().then(isSeparateWindow => {
          if (isSeparateWindow) {
            focusCurrentWindow();
          } else {
            tryWindowClose();
          }

          sendResponse({ status: 'ok' });
        });

        break;
      }

      default: {
        sendResponse({ status: 'error', message: 'Wrong action' });
        break;
      }
    }
  } catch (e) {
    sendResponse({ status: 'error' });
    CatchError(e);
  }

  return true;
};

export default popupOnMessage;
