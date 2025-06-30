// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';

/** 
* Function to check if the popup is opened in a separate window.
* @async
* @return {Promise<boolean>} Whether the popup is in a separate window.
*/
const isPopupInSeparateWindowExists = async () => {
  const popupInNewWindow = await popupIsInSeparateWindow();

  if (!popupInNewWindow) {
    return false;
  } else {
    return true;
  }
};

export default isPopupInSeparateWindowExists;
