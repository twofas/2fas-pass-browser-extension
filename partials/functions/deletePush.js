// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Deletes a push notification for a specific device.
* @async
* @param {string} deviceId - The ID of the device to delete the notification from.
* @param {string} notificationId - The ID of the notification to delete.
* @return {Promise<void>} 
*/
const deletePush = async (deviceId, notificationId) => {
  if (!deviceId || !notificationId) {
    return;
  }

  try {
    await fetch(`https://${import.meta.env.VITE_API_URL_ORIGIN}/device/${deviceId}/notifications/${notificationId}`, { method: 'DELETE' });
  } catch {}
};

export default deletePush;
