// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';

/** 
* Sends a notification to the front-end of a specific tab.
* @async
* @param {Object} notificationObject - The notification object.
* @param {string} notificationObject.Title - The title of the notification.
* @param {string} notificationObject.Message - The message of the notification.
* @param {number} tabID - The ID of the tab to send the notification to.
* @param {number} timeout - The timeout duration for the notification.
* @return {Promise<void>}
*/
const sendFrontEndPushAction = async (notificationObject, tabID, timeout) => {
  await injectCSIfNotAlready(tabID, REQUEST_TARGETS.CONTENT);
  
  return browser.tabs.sendMessage(tabID, {
    action: REQUEST_ACTIONS.NOTIFICATION,
    title: notificationObject.Title,
    message: notificationObject.Message,
    timeout,
    target: REQUEST_TARGETS.CONTENT
  });
};

export default sendFrontEndPushAction;
