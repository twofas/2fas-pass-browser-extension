// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { tabIsInternal, openPopup, sendMessageToAllFrames } from '@/partials/functions';
import { PULL_REQUEST_TYPES } from '@/constants';
import getItems from '@/partials/sessionStorage/getItems';
import URIMatcher from '@/partials/URIMatcher';
import sendAutofillToTab from './sendAutofillToTab';
import openPopupWindowInNewWindow from './openPopupWindowInNewWindow';
import TwofasNotification from '@/partials/TwofasNotification';
import sendMatchingLoginsToTab from './sendMatchingLoginsToTab';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

/**
* Processes the matching logins result sent from the content script.
* @async
* @param {Object} request - The result from the content script.
* @param {number} request.tabId - The tab ID.
* @param {string} request.status - 'action' or 'cancel'.
* @param {string} [request.vaultId] - The vault ID of the selected item.
* @param {string} [request.deviceId] - The device ID of the selected item.
* @param {string} [request.id] - The ID of the selected item.
* @param {string} [request.contentType] - The content type of the selected item.
* @return {Promise<void>}
*/
export const processMatchingLoginsResult = async request => {
  if (!request?.tabId || request?.status !== 'action') {
    return;
  }

  const { tabId, vaultId, deviceId, id, contentType } = request;

  let items = [];

  try {
    items = await getItems();
  } catch {}

  const item = items.find(i => i.deviceId === deviceId && i.vaultId === vaultId && i.id === id);

  if (!item) {
    return;
  }

  if (item.securityType === SECURITY_TIER.HIGHLY_SECRET && !item.isT3orT2WithSif) {
    let canAutofillPassword = false;

    try {
      const inputTests = await sendMessageToAllFrames(tabId, {
        action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS,
        target: REQUEST_TARGETS.CONTENT
      });

      canAutofillPassword = inputTests?.some(r => r.canAutofillPassword) || false;
    } catch {}

    if (canAutofillPassword) {
      const data = encodeURIComponent(JSON.stringify({
        action: PULL_REQUEST_TYPES.SIF_REQUEST,
        from: 'shortcut',
        data: {
          vaultId,
          deviceId,
          itemId: id,
          contentType,
          tabId
        }
      }));

      return openPopupWindowInNewWindow({ pathname: `/fetch/${data}` });
    }
  }

  return sendAutofillToTab(tabId, deviceId, vaultId, id);
};

/** 
* Function to handle the autofill shortcut action.
* @async
* @return {Promise<void>} A promise that resolves when the autofill action is completed.
*/
const shortcutAutofill = async () => {
  let configured = false;

  try {
    configured = await getConfiguredBoolean();
  } catch (e) {
    await CatchError(e);
  }

  if (!configured) {
    return openPopup();
  }

  let tabs;

  try {
    tabs = await browser.tabs.query({ active: true, currentWindow: true });
  } catch {}

  if (!tabs || tabs.length <= 0) {
    return TwofasNotification.show({
      title: getMessage('notification_shortcut_autofill_no_active_tab_title'),
      message: getMessage('notification_shortcut_autofill_no_active_tab_message')
    }, null, true);
  }

  tabs = tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
  const tab = tabs[0];

  if (tabIsInternal(tab)) {
    return TwofasNotification.show({
      title: getMessage('notification_shortcut_autofill_internal_page_title'),
      message: getMessage('notification_shortcut_autofill_internal_page_message')
    }, tab.id, true);
  }

  await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT);

  let items = [];
  let matchingLogins = [];

  try {
    items = await getItems();
    matchingLogins = URIMatcher.getMatchedAccounts(items, tab.url);
  } catch {}

  if (matchingLogins.length === 0) {
    return openPopup();
  }

  if (matchingLogins.length === 1) {
    const item = matchingLogins[0];

    if (!item.isT3orT2WithSif) {
      let canAutofillPassword = false;

      try {
        const inputTests = await sendMessageToAllFrames(tab.id, {
          action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS,
          target: REQUEST_TARGETS.CONTENT
        });

        canAutofillPassword = inputTests?.some(r => r.canAutofillPassword) || false;
      } catch {}

      if (canAutofillPassword) {
        const data = encodeURIComponent(JSON.stringify({
          action: PULL_REQUEST_TYPES.SIF_REQUEST,
          from: 'shortcut',
          data: {
            contentType: item.contentType,
            vaultId: item.vaultId,
            itemId: item.id,
            deviceId: item.deviceId,
            tabId: tab.id
          }
        }));

        return openPopupWindowInNewWindow({ pathname: `/fetch/${data}` });
      }
    }

    return sendAutofillToTab(tab.id, item.deviceId, item.vaultId, item.id);
  }

  matchingLogins = matchingLogins.map(item => {
    if (item?.securityType === SECURITY_TIER.HIGHLY_SECRET && item?.sifExists) {
      item.t2WithPassword = true;
    }

    return item;
  });

  await sendMatchingLoginsToTab(tab.id, matchingLogins);
};

export default shortcutAutofill;
