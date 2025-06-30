// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import popupIsInSeparateWindow from './popupIsInSeparateWindow';
import focusPopupWindow from './focusPopupWindow';

/** 
* Function to open the popup window or focus it if it already exists.
* @async
* @return {Promise<void>} A promise that resolves when the popup is opened or focused.
*/
const openPopup = async () => {
  const separateWindow = await popupIsInSeparateWindow();

  if (separateWindow) {
    await focusPopupWindow();
  } else {
    const currentWindow = await browser.windows.getCurrent();
    
    try {
      await browser.windows.update(currentWindow.id, { focused: true });
      await browser.action.openPopup({ windowId: currentWindow.id });
    } catch {}
  }
};

export default openPopup;
