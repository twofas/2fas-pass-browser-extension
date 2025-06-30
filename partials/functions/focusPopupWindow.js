// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getPopupWindowData from '@/partials/functions/getPopupWindowData';

/** 
* Focuses on the popup window if it exists.
* @async
* @return {Promise<void>} True if the popup window was focused, false otherwise.
*/
const focusPopupWindow = async () => {
  const windowData = await getPopupWindowData();

  if (windowData?.windowId) {
    try {
      await browser.windows.update(windowData.windowId, { focused: true });
      return true;
    } catch {
      return false;
    }
  }

  return false;
};

export default focusPopupWindow;
