// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { popupIsInSeparateWindow, getPopupWindowData } from '@/partials/functions';

/** 
* Function to open a popup window in a new window with the specified data.
* @async
* @param {Object} data - The data to be sent to the popup window.
* @return {Promise<void>} A promise that resolves when the popup window is opened.
*/
const openPopupWindowInNewWindow = async data => {
  let createNewWindow = true;

  if (await popupIsInSeparateWindow()) {
    const windowData = await getPopupWindowData();

    if (windowData && windowData?.windowId && windowData?.id) {
      try {
        await browser.tabs.update(windowData.id, { url: `popup.html#${data.pathname}?newWindow` });
        await browser.windows.update(windowData.windowId, { focused: true });
        createNewWindow = false;
      } catch {}
    }
  }

  if (!createNewWindow) {
    return;
  }

  let attributes = '';

  if (data && data?.pathname) {
    attributes = `${data.pathname}`;
  }

  try {
    const w = await browser.windows.getCurrent();
    await browser.windows.create({
      focused: true,
      incognito: false,
      height: 639,
      left: Math.round((w.width / 2) - (416 / 2) + w.left || 0),
      top: Math.round((w.height / 2) - (639 / 2) + w.top || 0),
      type: 'popup',
      url: `popup.html#${attributes}?newWindow`,
      width: 416
    });
  } catch (e) {
    await CatchError(e);
  }
};

export default openPopupWindowInNewWindow;
