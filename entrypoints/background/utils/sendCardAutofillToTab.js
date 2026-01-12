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
* Sends PaymentCard autofill data to a specific tab.
* @async
* @param {number} tabId - The ID of the tab to which the autofill data should be sent.
* @param {string} deviceId - The ID of the device.
* @param {string} vaultId - The ID of the vault.
* @param {string} itemId - The ID of the PaymentCard item.
* @return {Promise<void>}
*/
const sendCardAutofillToTab = async (tabId, deviceId, vaultId, itemId) => {
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
      additional: { func: 'sendCardAutofillToTab - getItem' }
    });
  }

  if (!item) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_lack_of_service_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_lack_of_service_message')
    }, tabId, true);
  }

  const cryptoAvailableRes = await sendMessageToTab(tabId, {
    action: REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE,
    target: REQUEST_TARGETS.CONTENT
  });

  const cryptoAvailable = cryptoAvailableRes.status === 'ok' && cryptoAvailableRes.cryptoAvailable;
  const hasCardData = item.sifExists;
  const hasCardholderName = item?.content?.cardHolder && item.content.cardHolder.length > 0;

  if (!hasCardData && !hasCardholderName) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_card_autofill_no_data_title'),
      Message: browser.i18n.getMessage('notification_card_autofill_no_data_message')
    }, tabId, true);
  }

  let decryptedCardNumber = '';
  let decryptedExpirationDate = '';
  let decryptedSecurityCode = '';
  let encryptedCardNumberB64 = null;
  let encryptedExpirationDateB64 = null;
  let encryptedSecurityCodeB64 = null;

  if (hasCardData) {
    try {
      const decryptedValues = await item.decryptSif();
      decryptedCardNumber = decryptedValues.cardNumber || '';
      decryptedExpirationDate = decryptedValues.expirationDate || '';
      decryptedSecurityCode = decryptedValues.securityCode || '';
    } catch {
      return TwofasNotification.show({
        Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
        Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
      }, tabId, true);
    }

    if (!cryptoAvailable) {
      encryptedCardNumberB64 = decryptedCardNumber;
      encryptedExpirationDateB64 = decryptedExpirationDate;
      encryptedSecurityCodeB64 = decryptedSecurityCode;
    } else {
      let localKeyCrypto = null;

      try {
        const localKey = await storage.getItem('local:lKey');

        localKeyCrypto = await crypto.subtle.importKey(
          'raw',
          Base64ToArrayBuffer(localKey),
          { name: 'AES-GCM' },
          false,
          ['encrypt']
        );
      } catch (e) {
        throw new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabImportKeyError, {
          event: e,
          additional: { func: 'sendCardAutofillToTab - importKey' }
        });
      }

      if (decryptedCardNumber) {
        const cardNumberResult = await encryptValueForTransmission(decryptedCardNumber, localKeyCrypto);

        if (cardNumberResult.status !== 'ok') {
          return TwofasNotification.show({
            Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
            Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
          }, tabId, true);
        }

        encryptedCardNumberB64 = cardNumberResult.data;
      }

      if (decryptedExpirationDate) {
        const expirationDateResult = await encryptValueForTransmission(decryptedExpirationDate, localKeyCrypto);

        if (expirationDateResult.status !== 'ok') {
          return TwofasNotification.show({
            Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
            Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
          }, tabId, true);
        }

        encryptedExpirationDateB64 = expirationDateResult.data;
      }

      if (decryptedSecurityCode) {
        const securityCodeResult = await encryptValueForTransmission(decryptedSecurityCode, localKeyCrypto);

        if (securityCodeResult.status !== 'ok') {
          return TwofasNotification.show({
            Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
            Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
          }, tabId, true);
        }

        encryptedSecurityCodeB64 = securityCodeResult.data;
      }

      localKeyCrypto = null;
    }

    decryptedCardNumber = '';
    decryptedExpirationDate = '';
    decryptedSecurityCode = '';
  }

  let iframePermissionGranted = true;

  try {
    const permissionResults = await sendMessageToAllFrames(tabId, {
      action: REQUEST_ACTIONS.CHECK_IFRAME_PERMISSION,
      target: REQUEST_TARGETS.CONTENT,
      autofillType: 'card'
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
        return;
      }
    }
  } catch (e) {
    await CatchError(e);
  }

  const actionData = {
    action: REQUEST_ACTIONS.AUTOFILL_CARD,
    cardholderName: item.content.cardHolder,
    cardIssuer: item.content.cardIssuer,
    target: REQUEST_TARGETS.CONTENT,
    cryptoAvailable,
    iframePermissionGranted
  };

  if (encryptedCardNumberB64) {
    actionData.cardNumber = encryptedCardNumberB64;
    actionData.cardNumberEncrypted = true;
  }

  if (encryptedExpirationDateB64) {
    actionData.expirationDate = encryptedExpirationDateB64;
    actionData.expirationDateEncrypted = true;
  }

  if (encryptedSecurityCodeB64) {
    actionData.securityCode = encryptedSecurityCodeB64;
    actionData.securityCodeEncrypted = true;
  }

  encryptedCardNumberB64 = null;
  encryptedExpirationDateB64 = null;
  encryptedSecurityCodeB64 = null;

  let response;

  try {
    response = await sendMessageToAllFrames(tabId, actionData);
  } catch (e) {
    await CatchError(e);

    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  if (!response) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  const relevantResponses = response.filter(r => r && r.status && r.message !== 'No input fields found') || [];

  if (relevantResponses.length === 0) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_card_autofill_no_inputs_title'),
      Message: browser.i18n.getMessage('notification_card_autofill_no_inputs_message')
    }, tabId, true);
  }

  const isOk = relevantResponses.some(frameResponse => frameResponse.status === 'ok');
  const isPartial = relevantResponses.some(frameResponse => frameResponse.status === 'partial');

  const allFilledFields = relevantResponses.reduce((acc, r) => {
    if (r.filledFields) {
      Object.keys(r.filledFields).forEach(field => {
        if (r.filledFields[field]) {
          acc[field] = true;
        }
      });
    }

    return acc;
  }, {});

  const allMissingInputFields = relevantResponses
    .flatMap(r => r.missingInputFields || [])
    .filter((field, index, self) => self.indexOf(field) === index)
    .filter(field => !allFilledFields[field]);
  const hasMissingInputs = allMissingInputFields.length > 0;

  if (isOk && !isPartial && !hasMissingInputs) {
    return;
  }

  if (isPartial || hasMissingInputs) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_card_autofill_partial_title'),
      Message: browser.i18n.getMessage('notification_card_autofill_partial_message')
    }, tabId, true);
  }
};

export default sendCardAutofillToTab;
