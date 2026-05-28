// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import copyValue from '@/partials/functions/copyValue';

/** 
* Function to handle the URI copy action.
* @async
* @param {Object} option - The option object.
* @return {Promise<void>}
*/
const handleUriCopyClick = async option => {
  if (option?.selectProps?.setMore) {
    option.selectProps.setMore(false);
  }

  try {
    await copyValue(option.data.value, option.data.deviceId, option.data.vaultId, option.data.itemId, 'uri');
    showToast(getMessage('notification_uri_copied'), 'success');
  } catch (e) {
    showToast(getMessage('error_uri_copy_failed'), 'error');
    await CatchError(e);
  }
};

export default handleUriCopyClick;
