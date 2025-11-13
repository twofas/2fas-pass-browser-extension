// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItem from '@/partials/sessionStorage/getItem';
import copyValue from '@/partials/functions/copyValue';

/** 
* Function to handle the username action.
* @async
* @param {number} deviceId - The ID of the device.
* @param {number} vaultId - The ID of the vault.
* @param {number} itemId - The ID of the item.
* @return {Promise<void>} 
*/
const handleName = async (deviceId, vaultId, itemId) => {
  let item;

  try {
    item = await getItem(deviceId, vaultId, itemId);
  } catch (e) {
    showToast(browser.i18n.getMessage('error_secure_note_not_found'), 'error');
    await CatchError(e);
    return;
  }

  if (!item) {
    showToast(browser.i18n.getMessage('error_secure_note_not_found'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleNameNoService, { additional: { func: 'handleName' } }));
    return;
  }

  try {
    const { name } = item.content;
    await copyValue(name, deviceId, vaultId, item.id, 'name');
    showToast(browser.i18n.getMessage('notification_secure_note_name_copied'), 'success');
  } catch (e) {
    showToast(browser.i18n.getMessage('error_secure_note_name_copy_failed'), 'error');
    await CatchError(e);
  }
};

export default handleName;
