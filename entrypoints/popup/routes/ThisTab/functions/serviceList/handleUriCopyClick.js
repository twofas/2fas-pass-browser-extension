// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import copyValue from './copyValue';

/** 
* Function to handle the URI copy action.
* @async
* @param {Object} props - The props object.
* @return {Promise<void>}
*/
const handleUriCopyClick = async props => {
  props.toggleMenu(!props.more);

  try {
    await copyValue(props.data.value, props.data.loginId, 'uri');
    showToast(browser.i18n.getMessage('notification_uri_copied'), 'success');
  } catch (e) {
    showToast(browser.i18n.getMessage('error_uri_copy_failed'), 'error');
    await CatchError(e);
  }
};

export default handleUriCopyClick;
