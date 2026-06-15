// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab, encryptCardSifForTransmission, resolveCrossDomainPermissions, saveCrossDomainPreferences, aggregateCardAutofillResponses } from '@/partials/functions';
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
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
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
      Title: getMessage('notification_send_autofill_to_tab_lack_of_service_title'),
      Message: getMessage('notification_send_autofill_to_tab_lack_of_service_message')
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
      Title: getMessage('notification_card_autofill_no_data_title'),
      Message: getMessage('notification_card_autofill_no_data_message')
    }, tabId, true);
  }

  let encryptedCardNumberB64 = null;
  let encryptedExpirationDateB64 = null;
  let encryptedSecurityCodeB64 = null;

  if (hasCardData) {
    const encryptResult = await encryptCardSifForTransmission(item, cryptoAvailable);

    if (encryptResult.status === 'decryptError') {
      await CatchError(new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabDecryptSif, {
        event: encryptResult.event,
        additional: { func: 'sendCardAutofillToTab - decryptSif' }
      }));

      return TwofasNotification.show({
        Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
        Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
      }, tabId, true);
    }

    if (encryptResult.status === 'importKeyError') {
      throw new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabImportKeyError, {
        event: encryptResult.event,
        additional: { func: 'sendCardAutofillToTab - importKey' }
      });
    }

    if (encryptResult.status === 'encryptError') {
      await CatchError(new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabEncryptError, {
        additional: { func: `sendCardAutofillToTab - encryptValueForTransmission (${encryptResult.field})` }
      }));

      return TwofasNotification.show({
        Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
        Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
      }, tabId, true);
    }

    encryptedCardNumberB64 = encryptResult.cardNumber;
    encryptedExpirationDateB64 = encryptResult.expirationDate;
    encryptedSecurityCodeB64 = encryptResult.securityCode;
  }

  const iframePermissionGranted = true;
  let crossDomainAllowedDomains = [];

  try {
    const resolution = await resolveCrossDomainPermissions(tabId, 'card', {
      hasCardholderName,
      hasCardNumber: hasCardData,
      hasExpirationDate: hasCardData,
      hasSecurityCode: hasCardData
    });

    if (resolution.needsDialog) {
      try {
        const tab = await browser.tabs.get(tabId);

        await browser.windows.update(tab.windowId, { focused: true });
        await browser.tabs.update(tabId, { active: true });

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        await CatchError(e);
      }

      const confirmResult = await sendMessageToTab(tabId, {
        action: REQUEST_ACTIONS.SHOW_CROSS_DOMAIN_CONFIRM,
        target: REQUEST_TARGETS.CONTENT,
        unknownDomains: resolution.unknownDomains,
        theme: await storage.getItem('local:theme')
      });

      if (confirmResult?.status !== 'ok' || !confirmResult?.confirmed) {
        return;
      }

      await saveCrossDomainPreferences(confirmResult.domainPreferences);
      crossDomainAllowedDomains = [...resolution.crossDomainAllowedDomains, ...(confirmResult.allowedDomains || [])];
    } else if (resolution.allBlocked) {
      crossDomainAllowedDomains = [];
    } else {
      crossDomainAllowedDomains = resolution.crossDomainAllowedDomains;
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
    iframePermissionGranted,
    crossDomainAllowedDomains
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

  try {
    const reinjected = await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);

    if (!reinjected) {
      logger.warn(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'sendCardAutofillToTab - re-injection before AUTOFILL_CARD did not verify all frames', { tabId });
    }
  } catch (e) {
    await CatchError(e);
  }

  let response;

  try {
    response = await sendMessageToAllFrames(tabId, actionData);
  } catch (e) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'sendCardAutofillToTab - sendMessageToAllFrames threw', { tabId, errorMessage: e?.message });
    await CatchError(e);

    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  if (!response) {
    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  const { outcome } = aggregateCardAutofillResponses(response);

  if (outcome === 'noInputs') {
    return TwofasNotification.show({
      Title: getMessage('notification_card_autofill_no_inputs_title'),
      Message: getMessage('notification_card_autofill_no_inputs_message')
    }, tabId, true);
  }

  if (outcome === 'error') {
    return TwofasNotification.show({
      Title: getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  if (outcome === 'partial') {
    return TwofasNotification.show({
      Title: getMessage('notification_card_autofill_partial_title'),
      Message: getMessage('notification_card_autofill_partial_message')
    }, tabId, true);
  }
};

export default sendCardAutofillToTab;
