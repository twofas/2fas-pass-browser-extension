// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import getPopupWindowData from '@/partials/functions/getPopupWindowData';

const POPUP_WINDOW_WIDTH = 416;
const POPUP_WINDOW_HEIGHT = 639;

/**
* Takes a popup window out of full screen and gives it the popup size. Safari places a window
* created from a full-screen Space in that Space and ignores the requested size. The state is
* changed first and the bounds in a separate call, because a browser may reject bounds combined
* with a state change.
* @async
* @param {number} windowId - The ID of the popup window.
* @param {Object} bounds - The left, top, width and height the window was created with.
* @return {Promise<void>} A promise that resolves when the window has been updated.
*/
const exitPopupWindowFullscreen = async (windowId, bounds) => {
  await browser.windows.update(windowId, { state: 'normal' });
  await browser.windows.update(windowId, bounds);
};

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

  let bounds, createdWindow;

  try {
    const w = await browser.windows.getCurrent();

    bounds = {
      height: POPUP_WINDOW_HEIGHT,
      left: Math.round((w.width / 2) - (POPUP_WINDOW_WIDTH / 2) + w.left || 0),
      top: Math.round((w.height / 2) - (POPUP_WINDOW_HEIGHT / 2) + w.top || 0),
      width: POPUP_WINDOW_WIDTH
    };
    createdWindow = await browser.windows.create({
      ...bounds,
      focused: true,
      incognito: false,
      type: 'popup',
      url: `popup.html#${attributes}?newWindow`
    });
  } catch (e) {
    await CatchError(e);
    return;
  }

  if (!createdWindow?.id) {
    return;
  }

  try {
    const popupWindow = await browser.windows.get(createdWindow.id);

    if (popupWindow?.state === 'fullscreen') {
      await exitPopupWindowFullscreen(createdWindow.id, bounds);
    }
  } catch (e) {
    await CatchError(e);
  }
};

export default openPopupWindowInNewWindow;
