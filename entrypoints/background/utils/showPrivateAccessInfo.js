// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import openPopupWindowInNewWindow from './openPopupWindowInNewWindow';

/**
* Function to tell the user that autofill needs access to private windows. Called when an autofill trigger arrives
* without a tab: Safari sends none for a private window the extension may not run in, e.g. the sign-in window an
* app such as Mail opens. Shows the info only when the extension really lacks that access.
* @async
* @return {Promise<boolean>} True if the info was shown, otherwise false.
*/
const showPrivateAccessInfo = async () => {
  let allowed = true;

  try {
    allowed = await browser.extension.isAllowedIncognitoAccess();
  } catch {
    allowed = true;
  }

  if (allowed !== false) {
    return false;
  }

  logger.info(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'PrivateAccessInfo - autofill trigger without a tab, private access missing');

  await openPopupWindowInNewWindow({ pathname: '/private-access' });

  return true;
};

export default showPrivateAccessInfo;
