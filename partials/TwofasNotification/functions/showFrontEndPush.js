// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import notification from '@/entrypoints/content/functions/notification'; // FUTURE - Move to partials?

/** 
* Function to show a frontend push notification.
* @async
* @param {Object} notificationObject - The notification object.
* @param {string} notificationObject.Title - The title of the notification.
* @param {string} notificationObject.Message - The message of the notification.
* @param {number} timeout - The timeout duration for the notification.
* @return {Promise<void>}
*/
const showFrontEndPush = async (notificationObject, timeout) => {
  const theme = await storage.getItem('local:theme');

  const notificationObj = {
    title: notificationObject.Title,
    message: notificationObject.Message,
    timeout,
    theme
  };

  return notification(notificationObj);
};

export default showFrontEndPush;
