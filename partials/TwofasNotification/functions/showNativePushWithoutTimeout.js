// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Shows a native push notification without a timeout.
* @param {Object} notificationObject - The notification object.
* @param {string} notificationObject.Title - The title of the notification.
* @param {string} notificationObject.Message - The message of the notification.
* @return {Promise<void>}
*/
const showNativePushWithoutTimeout = async notificationObject => {
  const notificationOptions = {
    title: notificationObject.Title,
    message: notificationObject.Message,
    iconUrl: '../images/icons/icon128.png',
    silent: false,
    requireInteraction: true,
    type: 'basic',
    priority: 2
  };

  if (import.meta.env.BROWSER === 'firefox') {
    delete notificationOptions.silent;
    delete notificationOptions.requireInteraction;
  }

  try {
    await browser.notifications.create('', notificationOptions);
  } catch {}
};

export default showNativePushWithoutTimeout;
