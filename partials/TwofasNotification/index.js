// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendFrontEndPushAction, showFrontEndPush, showNativePush, showNativePushWithoutTimeout } from './functions';
import './TwofasNotification.scss';

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
        return sendFrontEndPushAction(notificationObject, tabID, true);
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
        return sendFrontEndPushAction(notificationObject, tabID, false);
      } else {
        return showFrontEndPush(notificationObject, false);
      }
    }
  }
}

export default TwoFasNotification;
