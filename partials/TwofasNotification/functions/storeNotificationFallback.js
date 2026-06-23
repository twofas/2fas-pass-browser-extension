// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Persists a notification that could not be delivered through the in-page push channel
* so the popup can surface it on next open. This is the only notification channel left
* when there is no native notifications API (Safari never has the `notifications`
* permission, so its `local:nativePush` is always false) and the content script that
* would render the in-page push is unreachable — exactly the situation autofill
* notifications report when content-script injection fails. Mirrors the
* `autofillT2FailedPending` pattern (session storage keyed by tab, consumed on popup open).
* @async
* @param {number} tabID - The ID of the tab the notification was meant for.
* @param {Object} notificationObject - The notification object.
* @param {string} notificationObject.Title - The title of the notification.
* @param {string} notificationObject.Message - The message of the notification.
* @param {boolean} [timeout=true] - Whether the notification should auto-dismiss when shown.
* @return {Promise<void>}
*/
const storeNotificationFallback = async (tabID, notificationObject, timeout = true) => {
  if (!tabID) {
    return;
  }

  try {
    await storage.setItem(`session:notificationPending-${tabID}`, JSON.stringify({
      Title: notificationObject?.Title,
      Message: notificationObject?.Message,
      timeout
    }));

    logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - storeNotificationFallback');
  } catch (e) {
    await CatchError(e);
  }
};

export default storeNotificationFallback;
