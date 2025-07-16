// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import openBrowserPage from '../utils/openBrowserPage';
import openPopupWindowInNewWindow from '../utils/openPopupWindowInNewWindow';
import isText from '@/partials/functions/isText';
import openInstallPage from '../utils/openInstallPage';
import runMigrations from '../migrations';
import getLocalKey from '../utils/getLocalKey';
import onTabFocused from '../tabs/onTabFocused';

/** 
* Function to handle messages sent to the background script.
* @param {Object} request - The request object containing the action and data.
* @param {Object} sender - The sender object containing information about the message sender.
* @param {Function} sendResponse - The function to send a response back to the sender.
* @param {Object} migrations - The state object to track migrations.
* @return {Promise<boolean>} A promise that resolves to true if the message is handled successfully, otherwise false.
*/
const onMessage = (request, sender, sendResponse, migrations) => {
  try {
    if (!request || !request.action || request.target !== REQUEST_TARGETS.BACKGROUND) {
      return false;
    }
  
    switch (request.action) {
      case REQUEST_ACTIONS.OPEN_BROWSER_PAGE: {
        if (
          request?.url &&
          isText(request.url)
        ) {
          openBrowserPage(request.url)
            .then(() => { sendResponse({ status: 'ok' }); })
            .catch(e => { sendResponse({ status: 'error', message: e.message }); })
        } else {
          sendResponse({ status: 'error', message: 'Empty or wrong URL' });
        }

        break;
      }

      case REQUEST_ACTIONS.OPEN_POPUP_WINDOW_IN_NEW_WINDOW: {
        if (
          request?.pathname &&
          isText(request.pathname)
        ) {
          openPopupWindowInNewWindow({ pathname: request.pathname })
            .then(() => { sendResponse({ status: 'ok' }); })
            .catch(e => { sendResponse({ status: 'error', message: e.message }); })
        } else {
          sendResponse({ status: 'error', message: 'Empty or wrong data' });
        }

        break;
      }

      case REQUEST_ACTIONS.RESET_EXTENSION: {
        migrations.state = false;

        browser.storage.local.clear()
          .then(async () => { await browser.storage.session.clear(); })
          .then(async () => { await runMigrations(); })
          .then(() => { migrations.state = true; })
          .then(async () => { await openInstallPage(); })
          .then(() => { sendResponse({ status: 'ok' }); })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });

        break;
      }

      case REQUEST_ACTIONS.GET_LOCAL_KEY: {
        getLocalKey()
          .then(lKey => { sendResponse({ status: 'ok', data: lKey }); })
          .catch(e => { sendResponse({ status: 'error', message: e.message }); });

        break;
      }

      case REQUEST_ACTIONS.TAB_FOCUS: {
        onTabFocused(sender.tab)
          .finally(() => { sendResponse({ status: 'ok' }); });

        break;
      }
  
      default: {
        sendResponse({ status: 'error', message: 'Wrong action' });
        break;
      }
    }
  } catch (e) {
    sendResponse({ status: 'error', message: 'Unknown error' });
    CatchError(e);
  }

  return true;
};

export default onMessage;
