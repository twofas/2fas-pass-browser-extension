// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to send the current tab's domain to a popup window.
* @async
* @param {number} tabId - The ID of the tab to send the domain from.
* @return {Promise<void>} A promise that resolves when the domain is sent.
*/
const sendDomainToPopupWindow = async tabId => {
  const extUrl = browser.runtime.getURL('/popup.html');
  let tab, popup;

  try {
    popup = await browser.tabs.query({ windowType: 'popup', url: `${extUrl}*` });
  } catch (e) {
    await CatchError(e);
  }

  if (!popup || popup.length <= 0) {
    return;
  }

  try {
    tab = await browser.tabs.get(tabId);
  } catch {}

  if (!tab || !tab?.url || tab?.url?.includes(extUrl)) {
    return;
  }

  try {
    await browser.tabs.sendMessage(
      popup[0].id,
      {
        target: REQUEST_TARGETS.POPUP_ADD_NEW,
        action: REQUEST_ACTIONS.SEND_URL,
        url: tab.url
      }
    );

    await browser.tabs.sendMessage(
      popup[0].id,
      {
        target: REQUEST_TARGETS.POPUP_THIS_TAB,
        action: REQUEST_ACTIONS.SEND_URL,
        url: tab.url
      }
    );
  } catch (e) {
    await CatchError(e);
  }
};

export default sendDomainToPopupWindow;
