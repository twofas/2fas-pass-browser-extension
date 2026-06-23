// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, popupIsInSeparateWindow, closeWindowIfNotInSeparateWindow, encryptCardSifForTransmission, resolveCrossDomainPermissions } from '@/partials/functions';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import protectCardActionData from '@/entrypoints/background/utils/protectCardActionData';
import { acquireAutofillTab, showT2Toast, showGenericToast } from './autofillPopupShared';
import { PULL_REQUEST_TYPES } from '@/constants';
import PaymentCard from '@/models/itemModels/PaymentCard';

/**
* Handles the autofill action for PaymentCard items.
* @async
* @param {PaymentCard} item - The PaymentCard item to autofill.
* @param {function} navigate - The navigate function.
* @return {Promise<void>}
*/
const handleCardAutofill = async (item, navigate) => {
  const isHighlySecret = item.securityType === SECURITY_TIER.HIGHLY_SECRET;
  const onTabError = isHighlySecret ? showT2Toast : showGenericToast;

  logger.info(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'Popup-ThisTab - card autofill triggered', {
    itemId: item?.id,
    deviceId: item?.deviceId,
    vaultId: item?.vaultId,
    securityType: item?.securityType
  });

  const prolog = await acquireAutofillTab(onTabError, 'card');

  if (!prolog) {
    return;
  }

  const { tab, cryptoAvailableRes } = prolog;
  const hasCardData = item.sifExists;
  const hasCardholderName = item?.content?.cardHolder && item.content.cardHolder.length > 0;
  let sifDecrypt = true;
  let needsFetchSif = false;

  if (isHighlySecret) {
    if (!hasCardData) {
      let canAutofill = false;
      let canAutofillAnySifField = false;

      try {
        const inputTests = await sendMessageToAllFrames(tab.id, {
          action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS_CARD,
          target: REQUEST_TARGETS.CONTENT
        });

        const canAutofillCardNumber = inputTests.some(input => input.canAutofillCardNumber);
        const canAutofillExpirationDate = inputTests.some(input => input.canAutofillExpirationDate);
        const canAutofillSecurityCode = inputTests.some(input => input.canAutofillSecurityCode);
        const canAutofillCardholderName = inputTests.some(input => input.canAutofillCardholderName);

        canAutofillAnySifField = canAutofillCardNumber || canAutofillExpirationDate || canAutofillSecurityCode;
        canAutofill = canAutofillAnySifField || canAutofillCardholderName;
      } catch {
        canAutofill = false;
      }

      if (!canAutofill) {
        showT2Toast();
        return;
      }

      if (canAutofillAnySifField) {
        navigate(
          '/fetch', {
            state: {
              action: PULL_REQUEST_TYPES.SIF_REQUEST,
              from: 'autofill',
              data: {
                itemId: item.id,
                deviceId: item.deviceId,
                vaultId: item.vaultId,
                tabId: tab.id,
                cryptoAvailable: cryptoAvailableRes.cryptoAvailable,
                contentType: PaymentCard.contentType
              }
            }
          }
        );

        return;
      }

      sifDecrypt = false;
      needsFetchSif = true;
    }
  } else if (item.securityType === SECURITY_TIER.SECRET) {
    if (!hasCardData && hasCardholderName) {
      sifDecrypt = false;
    } else if (!hasCardData && !hasCardholderName) {
      showToast(getMessage('this_tab_autofill_no_card_data'), 'error');
      return;
    }
  }

  let encryptedCardNumberB64 = null;
  let encryptedExpirationDateB64 = null;
  let encryptedSecurityCodeB64 = null;

  if (sifDecrypt) {
    const cryptoAvailable = cryptoAvailableRes.status === 'ok' && cryptoAvailableRes.cryptoAvailable;
    const encryptResult = await encryptCardSifForTransmission(item, cryptoAvailable);

    if (encryptResult.status === 'decryptError') {
      showToast(getMessage('error_autofill_failed'), 'error');
      await CatchError(encryptResult.event);
      return;
    }

    if (encryptResult.status === 'importKeyError') {
      showToast(getMessage('error_autofill_failed'), 'error');
      await CatchError(encryptResult.event);
      return;
    }

    if (encryptResult.status !== 'ok') {
      showToast(getMessage('error_autofill_failed'), 'error');
      return;
    }

    encryptedCardNumberB64 = encryptResult.cardNumber;
    encryptedExpirationDateB64 = encryptResult.expirationDate;
    encryptedSecurityCodeB64 = encryptResult.securityCode;
  }

  const actionData = {
    action: REQUEST_ACTIONS.AUTOFILL_CARD,
    cardholderName: item.content.cardHolder,
    cardIssuer: item.content.cardIssuer,
    target: REQUEST_TARGETS.CONTENT,
    cryptoAvailable: cryptoAvailableRes.cryptoAvailable,
    iframePermissionGranted: true,
    crossDomainAllowedDomains: []
  };

  if (sifDecrypt) {
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
  }

  encryptedCardNumberB64 = null;
  encryptedExpirationDateB64 = null;
  encryptedSecurityCodeB64 = null;

  try {
    const resolution = await resolveCrossDomainPermissions(tab.id, 'card', {
      hasCardholderName,
      hasCardNumber: sifDecrypt,
      hasExpirationDate: sifDecrypt,
      hasSecurityCode: sifDecrypt
    });

    if (resolution.allBlocked) {
      actionData.crossDomainAllowedDomains = [];
    } else if (resolution.needsDialog) {
      const storageKey = `session:autofillCardData-${tab.id}`;

      // Never persist plaintext card fields at rest while the dialog is pending (finding #5).
      // protectCardActionData wraps them with the local key (no-op when crypto is available);
      // the background unwraps them back to plaintext just before the fill.
      const protectedResult = await protectCardActionData(actionData);

      if (protectedResult.status !== 'ok') {
        showToast(getMessage('error_autofill_failed'), 'error');
        return;
      }

      await storage.setItem(storageKey, JSON.stringify({
        actionData: protectedResult.actionData
      }));

      browser.runtime.sendMessage({
        action: REQUEST_ACTIONS.AUTOFILL_CARD_WITH_PERMISSION,
        target: REQUEST_TARGETS.BACKGROUND,
        tabId: tab.id,
        storageKey,
        domains: [...resolution.trustedDomains, ...resolution.untrustedDomains, ...resolution.unknownDomains]
      });

      return;
    } else {
      actionData.crossDomainAllowedDomains = resolution.crossDomainAllowedDomains || [];
    }
  } catch (e) {
    await CatchError(e);
  }

  let res;

  try {
    const reinjected = await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT);

    if (!reinjected) {
      logger.warn(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'Popup-ThisTab - card re-injection before AUTOFILL did not verify all frames', { tabId: tab.id });
    }
  } catch (e) {
    await CatchError(e);
  }

  try {
    res = await sendMessageToAllFrames(tab.id, actionData);
  } catch (e) {
    await CatchError(e);
  }

  if (!res) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'Popup-ThisTab - card AUTOFILL no response from any frame', { tabId: tab.id });
    showToast(getMessage('error_autofill_failed'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleAutofillNoResponse, { additional: { func: 'handleCardAutofill' } }));
    return;
  }

  const isOk = res.some(frameResponse => frameResponse.status === 'ok');
  const isPartial = res.some(frameResponse => frameResponse.status === 'partial');
  const partialResponse = res.find(frameResponse => frameResponse.status === 'partial');

  if (isPartial && partialResponse?.failedFields) {
    showToast(getMessage('notification_card_autofill_partial_message'), 'info');
    return;
  }

  if (isOk) {
    const separateWindow = await popupIsInSeparateWindow();

    if (!sifDecrypt && needsFetchSif) {
      showToast(getMessage('this_tab_autofill_fetch_card_data'), 'info');
    } else if (!sifDecrypt) {
      showToast(getMessage('this_tab_autofill_no_card_data_available'), 'info');
    } else if (!separateWindow) {
      await closeWindowIfNotInSeparateWindow(separateWindow);
    } else {
      showToast(getMessage('this_tab_autofill_success'), 'success');
    }
  } else {
    showToast(getMessage('this_tab_can_t_find_inputs'), 'info');
  }
};

export default handleCardAutofill;
