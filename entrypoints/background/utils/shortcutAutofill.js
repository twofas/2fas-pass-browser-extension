// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { tabIsInternal, openPopup, isT3orT2WithPassword } from '@/partials/functions';
import { PULL_REQUEST_TYPES } from '@/constants';
import getServices from '@/partials/sessionStorage/getServices';
import URIMatcher from '@/partials/URIMatcher';
import sendAutofillToTab from './sendAutofillToTab';
import openPopupWindowInNewWindow from './openPopupWindowInNewWindow';
import TwofasNotification from '@/partials/TwofasNotification';
import sendMatchingLoginsToTab from './sendMatchingLoginsToTab';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

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
      title: browser.i18n.getMessage('notification_shortcut_autofill_no_active_tab_title'),
      message: browser.i18n.getMessage('notification_shortcut_autofill_no_active_tab_message')
    }, null, true);
  }

  tabs = tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
  const tab = tabs[0];

  if (tabIsInternal(tab)) {
    return TwofasNotification.show({
      title: browser.i18n.getMessage('notification_shortcut_autofill_internal_page_title'),
      message: browser.i18n.getMessage('notification_shortcut_autofill_internal_page_message')
    }, tab.id, true);
  }

  await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT);

  let services = [];
  let matchingLogins = [];

  try {
    services = await getServices();
    matchingLogins = URIMatcher.getMatchedAccounts(services, tab.url);
  } catch {}

  if (matchingLogins.length === 0) {
    return openPopup();
  }

  if (matchingLogins.length === 1) {
    if (!isT3orT2WithPassword(matchingLogins[0])) {
      const data = encodeURIComponent(JSON.stringify({ action: PULL_REQUEST_TYPES.SIF_REQUEST, from: 'shortcut', data: { loginId: matchingLogins[0].id, deviceId: matchingLogins[0].deviceId, tabId: tab.id }}));
      return openPopupWindowInNewWindow({ pathname: `/fetch/${data}` });
    }

    return sendAutofillToTab(tab.id, matchingLogins[0].id); // FUTURE - Case with full data, no id?
  }

  matchingLogins = matchingLogins.map(item => {
    if (item?.securityType === SECURITY_TIER.HIGHLY_SECRET && item?.password && item?.password?.length > 0) {
      item.t2WithPassword = true;
    }

    return item;
  });

  const matchingLoginsAction = await sendMatchingLoginsToTab(tab.id, matchingLogins);

  if (matchingLoginsAction && matchingLoginsAction?.status === 'cancel') {
    return;
  } else if (matchingLoginsAction && matchingLoginsAction?.status === 'action') {
    const service = services.filter(service => service.id === matchingLoginsAction.id)[0];

    if (service.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      const data = encodeURIComponent(JSON.stringify({ action: PULL_REQUEST_TYPES.SIF_REQUEST, from: 'shortcut', data: { loginId: matchingLoginsAction.id, deviceId: matchingLoginsAction.deviceId, tabId: tab.id }}));
      return openPopupWindowInNewWindow({ pathname: `/fetch/${data}` });
    }

    return sendAutofillToTab(tab.id, matchingLoginsAction.id);
  }
};

export default shortcutAutofill;
