// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to handle the context menu when browser extension is not configured.
* @async
* @return {Boolean} Returns true if the context menu is created successfully, otherwise returns false.
*/
const contextMenuNotConfigured = async () => {
  let contextMenuSetting;

  try {
    contextMenuSetting = await storage.getItem('local:contextMenu');
  } catch (e) {
    await CatchError(e);
  }

  if (contextMenuSetting === false) {
    return false;
  }

  await browser.contextMenus.removeAll();

  try {
    browser.contextMenus.create({
      id: '2fas-pass-not-configured',
      enabled: true,
      title: browser.i18n.getMessage('background_contextMenuNotConfigured_connect'),
      type: 'normal',
      visible: true
    });
  } catch {
    return false;
  }

  return true;
};

export default contextMenuNotConfigured;
