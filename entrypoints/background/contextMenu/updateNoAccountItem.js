// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';
import URIMatcher from '@/partials/URIMatcher';

/** 
* Function to configure the context menu when there is no account item for tabId.
* @param {number} tabId - The ID of the tab to update the context menu for.
* @param {Array|null} items - The list of items to match against the URL.
* @return {Promise<boolean>} A promise that resolves to true if the context menu is updated successfully, otherwise false.
*/
const updateNoAccountItem = async (tabId, items = null) => {
  let tab;

  if (!tabId) {
    return false;
  }

  try {
    tab = await browser.tabs.get(tabId);
  } catch {}

  if (!tab || !tab.url) {
    return false;
  }

  try {
    if (!items) {
      items = await getItems();
    }
  } catch (e) {
    await CatchError(e);
    return false;
  }

  if (items && items.length > 0 && tab && tab?.url) {
    let matchedAccounts = [];

    try {
      matchedAccounts = URIMatcher.getMatchedAccounts(items, tab.url);
    } catch {
      return false;
    }

    if (matchedAccounts && matchedAccounts.length > 0) {
      try {
        await browser.contextMenus.update('2fas-pass-no-accounts', { visible: false }, () => browser.runtime.lastError);
      } catch {
        return false;
      }
    } else {
      try {
        await browser.contextMenus.update('2fas-pass-no-accounts', { visible: true }, () => browser.runtime.lastError);
      } catch {
        return false;
      }
    }
  } else {
    try {
      await browser.contextMenus.update('2fas-pass-no-accounts', { visible: false }, () => browser.runtime.lastError);
    } catch {
      return false;
    }
  }

  return true;
};

export default updateNoAccountItem;
