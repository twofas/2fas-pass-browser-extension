// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Reads and displays a notification persisted by storeNotificationFallback for the active
* tab, then clears it. Runs when the popup opens so notifications that could not reach the
* in-page push channel (Safari has no native notifications API) are still surfaced to the
* user as a toast. Mirrors the autofillT2FailedPending consumer (useAutofillFailedCheck):
* scoped to the active tab and one-shot (removed after read).
* @async
* @return {Promise<void>}
*/
const showPendingNotification = async () => {
  let tabId;

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    tabId = tabs?.[0]?.id;
  } catch {
    return;
  }

  if (!tabId) {
    return;
  }

  const key = `session:notificationPending-${tabId}`;
  let json;

  try {
    json = await storage.getItem(key);
  } catch {
    return;
  }

  if (!json) {
    return;
  }

  try {
    await storage.removeItem(key);
  } catch { }

  let data;

  try {
    data = JSON.parse(json);
  } catch {
    return;
  }

  const message = data?.Message && data.Message.length > 0 ? data.Message : data?.Title;

  if (!message || typeof message !== 'string') {
    return;
  }

  const autoClose = data?.timeout === false ? false : undefined;

  showToast(message, 'error', autoClose);
};

export default showPendingNotification;
