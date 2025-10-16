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
* @param {number} id - The ID of the item.
* @param {boolean} more - Indicates if more actions are available.
* @param {function} setMore - Function to update the more state.
* @return {Promise<void>} 
*/
const handleUsername = async (id, more, setMore) => {
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
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleUsernameNoService, { additional: { func: 'handleUsername' } }));
    return;
  }

  try {
    const { username } = item.content;
    await copyValue(username, item.id, 'username');
    showToast(browser.i18n.getMessage('notification_username_copied'), 'success');
  } catch (e) {
    showToast(browser.i18n.getMessage('error_username_copy_failed'), 'error');
    await CatchError(e);
  }
};

export default handleUsername;
