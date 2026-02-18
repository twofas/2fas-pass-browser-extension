// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItem from '@/partials/sessionStorage/getItem';
import { copyValue } from '@/partials/functions';

/**
* Function to handle copying the wifi password to clipboard.
* @async
* @param {string} deviceId - The ID of the device.
* @param {string} vaultId - The ID of the vault.
* @param {string} itemId - The ID of the item.
* @param {boolean} more - Indicates if more actions are available.
* @param {function} setMore - Function to update the more state.
* @return {Promise<void>}
*/
const handleWifiPassword = async (deviceId, vaultId, itemId, more, setMore) => {
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
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handlePasswordNoService, { additional: { func: 'handleWifiPassword' } }));
    return;
  }

  if (!item.sifExists) {
    navigator.clipboard.writeText('');
    showToast(getMessage('notification_wifi_password_copied'), 'success');
    return;
  }

  try {
    const decryptedData = await item.decryptSif();
    await copyValue(decryptedData.wifiPassword, deviceId, vaultId, item.id, 'wifiPassword');
    showToast(getMessage('notification_wifi_password_copied'), 'success');
  } catch (e) {
    showToast(getMessage('error_wifi_password_copy_failed'), 'error');
    await CatchError(e);
  }
};

export default handleWifiPassword;
