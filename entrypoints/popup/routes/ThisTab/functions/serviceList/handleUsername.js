// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getServices from '@/partials/sessionStorage/getServices';
import copyValue from './copyValue';

/** 
* Function to handle the username action.
* @async
* @param {number} id - The ID of the service.
* @param {boolean} more - Indicates if more actions are available.
* @param {function} setMore - Function to update the more state.
* @return {Promise<void>} 
*/
const handleUsername = async (id, more, setMore) => {
  let servicesStorage, service;

  if (more) {
    setMore(false);
  }

  try {
    servicesStorage = await getServices();
    service = servicesStorage.find(service => service.id === id);
  } catch (e) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(e);
    return;
  }

  if (!service) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleUsernameNoService, { additional: { func: 'handleUsername' } }));
    return;
  }

  try {
    const { username } = service;
    await copyValue(username);
    showToast(browser.i18n.getMessage('notification_username_copied'), 'success');
  } catch (e) {
    showToast(browser.i18n.getMessage('error_username_copy_failed'), 'error');
    await CatchError(e);
  }
};

export default handleUsername;
