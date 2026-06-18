// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';

/**
* Sends a notification to the front-end of a specific tab.
* The content script's NOTIFICATION handler resolves the message (even with an empty
* response), so a resolved sendMessage means the in-page notification was delivered.
* A thrown sendMessage means no content script is listening (e.g. injection failed) —
* the very case many autofill notifications report — so the in-page push was not shown.
* @async
* @param {Object} notificationObject - The notification object.
* @param {string} notificationObject.Title - The title of the notification.
* @param {string} notificationObject.Message - The message of the notification.
* @param {number} tabID - The ID of the tab to send the notification to.
* @param {number} timeout - The timeout duration for the notification.
* @return {Promise<boolean>} True when the in-page notification was delivered, false otherwise.
*/
const sendFrontEndPushAction = async (notificationObject, tabID, timeout) => {
  await injectCSIfNotAlready(tabID, REQUEST_TARGETS.CONTENT);

  try {
    await browser.tabs.sendMessage(tabID, {
      action: REQUEST_ACTIONS.NOTIFICATION,
      title: notificationObject.Title,
      message: notificationObject.Message,
      timeout,
      target: REQUEST_TARGETS.CONTENT
    });

    return true;
  } catch {
    return false;
  }
};

export default sendFrontEndPushAction;
