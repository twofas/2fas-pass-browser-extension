// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab, encryptValueForTransmission } from '@/partials/functions';
import getItem from '@/partials/sessionStorage/getItem';
import TwofasNotification from '@/partials/TwofasNotification';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';

/** 
* Function to send autofill data to a specific tab.
* @async
* @param {number} tabId - The ID of the tab to which the autofill data should be sent.
* @param {string} deviceId - The ID of the device to use for the autofill data.
* @param {string} vaultId - The ID of the vault to use for the autofill data.
* @param {string} itemId - The ID of the item to use for the autofill data.
* @return {Promise<void>} A promise that resolves when the autofill data is sent.
*/
const sendAutofillToTab = async (tabId, deviceId, vaultId, itemId) => {
  const injectedCS = await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);

  if (!injectedCS) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  let item;

  try {
    item = await getItem(deviceId, vaultId, itemId);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabToTabService, {
      event: e,
      additional: { func: 'sendAutofillToTab - getItem' }
    });
  }

  if (!item) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_lack_of_service_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_lack_of_service_message')
    }, tabId, true);
  }

  let noPassword = false;
  let noUsername = false;
  let decryptedPassword, encryptedValueB64;

  if (!item?.sifExists) {
    noPassword = true;
  }

  if (!item?.content?.username || item?.content?.username?.length <= 0) {
    noUsername = true;
  }

  const cryptoAvailableRes = await sendMessageToTab(tabId, {
    action: REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE,
    target: REQUEST_TARGETS.CONTENT
  });

  if (!noPassword) {
    try {
      const decryptedData = await item.decryptSif();
      decryptedPassword = decryptedData.password;
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabDecryptSif, {
        event: e,
        additional: { func: 'sendAutofillToTab - decryptSif' }
      });
    }

    const cryptoAvailable = cryptoAvailableRes.status === 'ok' && cryptoAvailableRes.cryptoAvailable;

    if (!cryptoAvailable) {
      encryptedValueB64 = decryptedPassword;
    } else {
      const passwordResult = await encryptValueForTransmission(decryptedPassword);

      if (passwordResult.status !== 'ok') {
        throw new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabEncryptError, {
          additional: { func: 'sendAutofillToTab - encryptValueForTransmission' }
        });
      }

      encryptedValueB64 = passwordResult.data;
    }
  }

  let iframePermissionGranted = true;
  let hasPasswordInAnyFrame = false;

  try {
    const inputCheckResults = await sendMessageToAllFrames(tabId, {
      action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS,
      target: REQUEST_TARGETS.CONTENT
    });

    hasPasswordInAnyFrame = inputCheckResults?.some(r => r.canAutofillPassword) || false;
  } catch (e) {
    await CatchError(e);
  }

  try {
    const permissionResults = await sendMessageToAllFrames(tabId, {
      action: REQUEST_ACTIONS.CHECK_IFRAME_PERMISSION,
      target: REQUEST_TARGETS.CONTENT,
      autofillType: 'login'
    });

    const crossDomainFrames = permissionResults?.filter(r => r.needsPermission) || [];
    const needsPermission = crossDomainFrames.length > 0;

    if (needsPermission) {
      const uniqueDomains = [...new Set(crossDomainFrames.map(f => f.frameInfo?.hostname).filter(Boolean))];

      const confirmMessage = browser.i18n.getMessage('autofill_cross_domain_warning_popup')
        .replace('DOMAINS', uniqueDomains.join(', '));

      const confirmResult = await sendMessageToTab(tabId, {
        action: REQUEST_ACTIONS.SHOW_CROSS_DOMAIN_CONFIRM,
        target: REQUEST_TARGETS.CONTENT,
        message: confirmMessage
      });

      if (confirmResult?.status !== 'ok' || !confirmResult?.confirmed) {
        iframePermissionGranted = false;
      }
    }
  } catch (e) {
    await CatchError(e);
  }

  try {
    const response = await sendMessageToAllFrames(
      tabId,
      {
        action: REQUEST_ACTIONS.AUTOFILL,
        username: item.content.username,
        password: encryptedValueB64,
        target: REQUEST_TARGETS.CONTENT,
        noPassword,
        noUsername,
        cryptoAvailable: cryptoAvailableRes?.cryptoAvailable,
        iframePermissionGranted,
        hasPasswordInAnyFrame
      }
    );

    const errorResponses = response.filter(frameResponse => frameResponse.status === 'error');

    if (errorResponses.length > 0) {
      if (errorResponses[0]?.status === 'error') {
        if (errorResponses[0]?.message === 'No username and password provided') {
          return TwofasNotification.show({
            Title: browser.i18n.getMessage('notification_shortcut_autofill_no_username_and_password_title'),
            Message: browser.i18n.getMessage('notification_shortcut_autofill_no_username_and_password_message')
          }, tabId, true);
        }
      }
    }
  } catch (e) {
    await CatchError(e);
    
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }
};

export default sendAutofillToTab;
