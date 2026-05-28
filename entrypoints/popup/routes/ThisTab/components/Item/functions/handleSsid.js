// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItem from '@/partials/sessionStorage/getItem';
import copyValue from '@/partials/functions/copyValue';

/**
* Function to handle copying the SSID to clipboard.
* @async
* @param {string} deviceId - The ID of the device.
* @param {string} vaultId - The ID of the vault.
* @param {string} itemId - The ID of the item.
* @param {boolean} more - Indicates if more actions are available.
* @param {function} setMore - Function to update the more state.
* @return {Promise<void>}
*/
const handleSsid = async (deviceId, vaultId, itemId, more, setMore) => {
  let item;

  if (more) {
    setMore(false);
  }

  try {
    item = await getItem(deviceId, vaultId, itemId);
  } catch (e) {
    showToast(getMessage('error_wifi_not_found'), 'error');
    await CatchError(e);
    return;
  }

  if (!item) {
    showToast(getMessage('error_wifi_not_found'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handlePasswordNoService, { additional: { func: 'handleSsid' } }));
    return;
  }

  try {
    const { ssid } = item.content;
    await copyValue(ssid, deviceId, vaultId, item.id, 'ssid');
    showToast(getMessage('notification_wifi_ssid_copied'), 'success');
  } catch (e) {
    showToast(getMessage('error_wifi_ssid_copy_failed'), 'error');
    await CatchError(e);
  }
};

export default handleSsid;
