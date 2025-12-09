// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab, tabIsInternal, getLastActiveTab, popupIsInSeparateWindow, closeWindowIfNotInSeparateWindow, generateNonce } from '@/partials/functions';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import { PULL_REQUEST_TYPES } from '@/constants';
import PaymentCard from '@/partials/models/itemModels/PaymentCard';

const showT2Toast = () => {
  showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2'), 'info');
};

const showGenericToast = () => {
  showToast(browser.i18n.getMessage('this_tab_can_t_autofill'), 'info');
};

/**
* Encrypts a value using the local key for secure transmission.
* @param {string} value - The value to encrypt.
* @return {Promise<{status: string, data?: string, message?: string}>} Encryption result.
*/
const encryptValueForTransmission = async value => {
  let nonce = null;
  let localKeyCrypto = null;
  let encryptedValue = null;

  try {
    nonce = generateNonce();
    const localKey = await storage.getItem('local:lKey');
    const localKeyAB = Base64ToArrayBuffer(localKey);

    localKeyCrypto = await crypto.subtle.importKey(
      'raw',
      localKeyAB,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    encryptedValue = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce.ArrayBuffer },
      localKeyCrypto,
      StringToArrayBuffer(value)
    );

    const encryptedBytes = EncryptBytes(nonce.ArrayBuffer, encryptedValue);

    return { status: 'ok', data: ArrayBufferToBase64(encryptedBytes) };
  } catch (e) {
    await CatchError(e);
    return { status: 'error', message: 'Encryption failed' };
  } finally {
    nonce = null;
    localKeyCrypto = null;
    encryptedValue = null;
  }
};

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

  let tab;

  try {
    tab = await getLastActiveTab(onTabError, t => !tabIsInternal(t));
  } catch (e) {
    await CatchError(e);
  }

  if (!tab) {
    return;
  }

  try {
    await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT);
  } catch (e) {
    onTabError();

    if (!e.message.includes('showing error page')) {
      await CatchError(e);
    }

    return;
  }

  const cryptoAvailableRes = await sendMessageToTab(tab.id, {
    action: REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE,
    target: REQUEST_TARGETS.CONTENT
  });

  const hasCardData = item.sifExists;
  const hasCardholderName = item?.content?.cardHolder && item.content.cardHolder.length > 0;
  let sifDecrypt = true;
  let needsFetchSif = false;

  if (isHighlySecret) {
    if (!hasCardData) {
      let canAutofill = false;
      let canAutofillEncryptedFields = false;

      try {
        const inputTests = await sendMessageToAllFrames(tab.id, {
          action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS_CARD,
          target: REQUEST_TARGETS.CONTENT
        });

        const canAutofillCardNumber = inputTests.some(input => input.canAutofillCardNumber);
        const canAutofillExpirationDate = inputTests.some(input => input.canAutofillExpirationDate);
        const canAutofillSecurityCode = inputTests.some(input => input.canAutofillSecurityCode);
        const canAutofillCardholderName = inputTests.some(input => input.canAutofillCardholderName);

        canAutofillEncryptedFields = canAutofillCardNumber || canAutofillExpirationDate || canAutofillSecurityCode;
        canAutofill = canAutofillEncryptedFields || canAutofillCardholderName;
      } catch {
        canAutofill = false;
      }

      if (!canAutofill) {
        showT2Toast();
        return;
      }

      if (canAutofillEncryptedFields) {
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
      showToast(browser.i18n.getMessage('this_tab_autofill_no_card_data'), 'error');
      return;
    }
  }

  let decryptedCardNumber = '';
  let decryptedExpirationDate = '';
  let decryptedSecurityCode = '';
  let encryptedCardNumberB64 = null;
  let encryptedExpirationDateB64 = null;
  let encryptedSecurityCodeB64 = null;

  if (sifDecrypt) {
    try {
      const decryptedValues = await item.decryptSif();
      decryptedCardNumber = decryptedValues.cardNumber || '';
      decryptedExpirationDate = decryptedValues.expirationDate || '';
      decryptedSecurityCode = decryptedValues.securityCode || '';
    } catch (e) {
      showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
      await CatchError(e);
      return;
    }

    const cryptoAvailable = cryptoAvailableRes.status === 'ok' && cryptoAvailableRes.cryptoAvailable;

    if (!cryptoAvailable) {
      encryptedCardNumberB64 = decryptedCardNumber;
      encryptedExpirationDateB64 = decryptedExpirationDate;
      encryptedSecurityCodeB64 = decryptedSecurityCode;
    } else {
      if (decryptedCardNumber) {
        const cardNumberResult = await encryptValueForTransmission(decryptedCardNumber);

        if (cardNumberResult.status !== 'ok') {
          showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
          return;
        }

        encryptedCardNumberB64 = cardNumberResult.data;
      }

      if (decryptedExpirationDate) {
        const expirationDateResult = await encryptValueForTransmission(decryptedExpirationDate);

        if (expirationDateResult.status !== 'ok') {
          showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
          return;
        }

        encryptedExpirationDateB64 = expirationDateResult.data;
      }

      if (decryptedSecurityCode) {
        const securityCodeResult = await encryptValueForTransmission(decryptedSecurityCode);

        if (securityCodeResult.status !== 'ok') {
          showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
          return;
        }

        encryptedSecurityCodeB64 = securityCodeResult.data;
      }
    }

    decryptedCardNumber = '';
    decryptedExpirationDate = '';
    decryptedSecurityCode = '';
  }

  let iframePermissionGranted = true;

  try {
    const permissionResults = await sendMessageToAllFrames(tab.id, {
      action: REQUEST_ACTIONS.CHECK_IFRAME_PERMISSION,
      target: REQUEST_TARGETS.CONTENT,
      autofillType: 'card'
    });

    const crossDomainFrames = permissionResults?.filter(r => r.needsPermission) || [];
    const needsPermission = crossDomainFrames.length > 0;

    if (needsPermission) {
      const uniqueDomains = [...new Set(crossDomainFrames.map(f => f.frameInfo?.hostname).filter(Boolean))];

      const message = browser.i18n.getMessage('autofill_cross_domain_warning_popup')
        .replace('DOMAINS', uniqueDomains.join(', '));

      iframePermissionGranted = window.confirm(message);

      if (!iframePermissionGranted) {
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
    cryptoAvailable: cryptoAvailableRes.cryptoAvailable,
    iframePermissionGranted
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

  let res;

  try {
    res = await sendMessageToAllFrames(tab.id, actionData);
  } catch (e) {
    await CatchError(e);
  }

  if (!res) {
    showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleAutofillNoResponse, { additional: { func: 'handleCardAutofill' } }));
    return;
  }

  const isOk = res.some(frameResponse => frameResponse.status === 'ok');
  const isPartial = res.some(frameResponse => frameResponse.status === 'partial');
  const partialResponse = res.find(frameResponse => frameResponse.status === 'partial');

  if (isPartial && partialResponse?.failedFields) {
    const failedFields = partialResponse.failedFields;
    let messageKey = 'this_tab_autofill_expiration_date_not_available';

    if (failedFields.includes('year') && !failedFields.includes('month')) {
      messageKey = 'this_tab_autofill_year_not_available';
    } else if (failedFields.includes('month') && !failedFields.includes('year')) {
      messageKey = 'this_tab_autofill_month_not_available';
    }

    showToast(browser.i18n.getMessage(messageKey), 'info');
    return;
  }

  if (isOk) {
    const separateWindow = await popupIsInSeparateWindow();

    if (!sifDecrypt && needsFetchSif) {
      showToast(browser.i18n.getMessage('this_tab_autofill_fetch_card_data'), 'info');
    } else if (!sifDecrypt) {
      showToast(browser.i18n.getMessage('this_tab_autofill_no_card_data_available'), 'info');
    } else if (!separateWindow) {
      await closeWindowIfNotInSeparateWindow(separateWindow);
    } else {
      showToast(browser.i18n.getMessage('this_tab_autofill_success'), 'success');
    }
  } else {
    showToast(browser.i18n.getMessage('this_tab_can_t_find_inputs'), 'info');
  }
};

export default handleCardAutofill;
