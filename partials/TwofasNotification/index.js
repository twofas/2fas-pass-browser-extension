// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendFrontEndPushAction, showFrontEndPush, showNativePush, showNativePushWithoutTimeout, storeNotificationFallback } from './functions';
import './TwofasNotification.scss';

/**
* Sends an in-page push notification and, when it cannot be delivered (no content script
* listening — e.g. injection failed), persists it so the popup can surface it on next open.
* This branch is only reached when native notifications are unavailable (Safari always, or a
* user who chose "custom" push), so the stored fallback is the only remaining channel.
* @async
* @param {Object} notificationObject - The notification object.
* @param {number} tabID - The ID of the tab to notify.
* @param {boolean} timeout - Whether the notification should auto-dismiss.
* @return {Promise<boolean>} Whether the in-page notification was delivered.
*/
const sendFrontEndPushWithFallback = async (notificationObject, tabID, timeout) => {
  const delivered = await sendFrontEndPushAction(notificationObject, tabID, timeout);

  if (!delivered) {
    await storeNotificationFallback(tabID, notificationObject, timeout);
  }

  return delivered;
};

/**
* Handles the display of notifications for the TwoFas extension.
* @module TwoFasNotification
*/
class TwoFasNotification {
  static async show (notificationObject, tabID = null, alert = false) {
    const storageNativePush = await storage.getItem('local:nativePush');

    if (storageNativePush) {
      return showNativePush(notificationObject, alert);
    } else {
      if (tabID) {
        return sendFrontEndPushWithFallback(notificationObject, tabID, true);
      } else {
        return showFrontEndPush(notificationObject, true);
      }
    }
  }

  static async showWithoutTimeout (notificationObject, tabID = null) {
    const storageNativePush = await storage.getItem('local:nativePush');

    if (storageNativePush) {
      return showNativePushWithoutTimeout(notificationObject);
    } else {
      if (tabID) {
        return sendFrontEndPushWithFallback(notificationObject, tabID, false);
      } else {
        return showFrontEndPush(notificationObject, false);
      }
    }
  }
}

export default TwoFasNotification;
