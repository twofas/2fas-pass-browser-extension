// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';

let isContextMenuConfiguring = false;

/** 
* Function to configure the context menu for the 2FAS Pass Browser Extension.
* @async
* @param {Array} items - An array of items to configure the context menu for.
* @return {void}
*/
const contextMenuConfigured = async (items = null) => {
  if (isContextMenuConfiguring) {
    return;
  }

  isContextMenuConfiguring = true;

  try {
    const contexts = ['page', 'editable'];

    if (import.meta.env.BROWSER !== 'safari')  {
      contexts.push('page_action');
    }

    let contextMenuSetting;

    try {
      contextMenuSetting = await storage.getItem('local:contextMenu');
    } catch (e) {
      await CatchError(e);
    }

    if (contextMenuSetting === false) {
      return;
    }

    try {
      if (!items) {
        items = await getItems(['Login']);
      }
    } catch (e) {
      await CatchError(e);
    }

    await browser.contextMenus.removeAll();

    // Top context menu
    try {
      browser.contextMenus.create({
        id: '2fas-pass-configured',
        enabled: true,
        title: '2FAS Pass Browser Extension',
        type: 'normal',
        visible: true,
        contexts
      });
    } catch (e) {
      await CatchError(e);
    }

    for (const item of items) {
      const contextMenuItem = item?.contextMenuItem;

      if (!contextMenuItem || Object.keys(contextMenuItem).length === 0) {
        continue;
      }

      try {
        browser.contextMenus.create(contextMenuItem);
      } catch (e) {
        await CatchError(e);
      }
    }

    // No accounts item
    try {
      browser.contextMenus.create({
        id: '2fas-pass-no-accounts',
        enabled: false,
        title: browser.i18n.getMessage('background_contextMenuConfigured_no_accounts'),
        type: 'normal',
        visible: false,
        parentId: '2fas-pass-configured',
        contexts
      });
    } catch (e) {
      await CatchError(e);
    }

    // Separator
    try {
      browser.contextMenus.create({
        id: '2fas-pass-separator',
        type: 'separator',
        parentId: '2fas-pass-configured',
        contexts
      });
    } catch (e) {
      await CatchError(e);
    }

    // Add account
    try {
      browser.contextMenus.create({
        id: '2fas-pass-add-account',
        enabled: true,
        title: browser.i18n.getMessage('background_contextMenuConfigured_add_account'),
        type: 'normal',
        visible: true,
        parentId: '2fas-pass-configured',
        contexts
      });
    } catch (e) {
      await CatchError(e);
    }
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.contextMenuConfiguredError, {
      event: e,
      additional: { func: 'contextMenuConfigured' }
    });
  } finally {
    isContextMenuConfiguring = false;
  }
};

export default contextMenuConfigured;
