// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItem from '@/partials/sessionStorage/getItem';
import { copyValue } from '@/partials/functions';

/** 
* Function to handle copying the password to clipboard.
* @async
* @param {number} id - The ID of the item.
* @param {boolean} more - Indicates if more actions are available.
* @param {function} setMore - Function to update the more state.
* @return {Promise<void>}
*/
const handlePassword = async (id, more, setMore) => {
  let item;

  if (more) {
    setMore(false);
  }

  try {
    item = await getItem(id);
  } catch (e) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(e);
    return;
  }

  if (!item) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handlePasswordNoService, { additional: { func: 'handlePassword' } }));
    return;
  }

  if (!item.sifExists) {
    navigator.clipboard.writeText('');
    showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
    return;
  }

  try {
    const decryptedData = await item.decryptSif();
    await copyValue(decryptedData.password, item.id, 'password');
    showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
  } catch (e) {
    showToast(browser.i18n.getMessage('error_password_copy_failed'), 'error');
    await CatchError(e);
  }
};

export default handlePassword;
