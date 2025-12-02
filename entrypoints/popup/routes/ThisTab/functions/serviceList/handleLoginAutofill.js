// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab, tabIsInternal, getLastActiveTab, popupIsInSeparateWindow, closeWindowIfNotInSeparateWindow, generateNonce } from '@/partials/functions';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import { PULL_REQUEST_TYPES } from '@/constants';
import Login from '@/partials/models/itemModels/Login';

const showT2Toast = () => {
  showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2'), 'info');
};

const showGenericToast = () => {
  showToast(browser.i18n.getMessage('this_tab_can_t_autofill'), 'info');
};

/**
* Handles the autofill action for Login items.
* @async
* @param {Login} item - The Login item to autofill.
* @param {function} navigate - The navigate function.
* @return {Promise<void>}
*/
const handleLoginAutofill = async (item, navigate) => {
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

  const hasPassword = item.sifExists;
  const hasUsername = item?.content.username && item.content.username.length > 0;
  let passwordDecrypt = true;
  let needsFetchPassword = false;

  if (isHighlySecret) {
    if (!hasPassword) {
      let canAutofill = false;
      let canAutofillPassword = false;

      try {
        const inputTests = await sendMessageToAllFrames(tab.id, {
          action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS,
          target: REQUEST_TARGETS.CONTENT
        });

        canAutofillPassword = inputTests.some(input => input.canAutofillPassword);
        const canAutofillUsername = inputTests.some(input => input.canAutofillUsername);
        canAutofill = canAutofillPassword || canAutofillUsername;
      } catch {
        canAutofill = false;
      }

      if (!canAutofill) {
        showT2Toast();
        return;
      }

      if (canAutofillPassword) {
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
                contentType: Login.contentType
              }
            }
          }
        );

        return;
      }

      passwordDecrypt = false;
      needsFetchPassword = true;
    }
  } else if (item.securityType === SECURITY_TIER.SECRET) {
    if (!hasPassword && hasUsername) {
      passwordDecrypt = false;
    } else if (!hasPassword && !hasUsername) {
      showToast(browser.i18n.getMessage('this_tab_autofill_no_username_and_password'), 'error');
      return;
    }
  }

  let decryptedPassword = '';
  let encryptedValueB64 = null;

  if (passwordDecrypt) {
    try {
      const decryptedValue = await item.decryptSif();
      decryptedPassword = decryptedValue.password;
    } catch (e) {
      showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
      await CatchError(e);
      return;
    }

    if (cryptoAvailableRes.status !== 'ok' || !cryptoAvailableRes.cryptoAvailable) {
      encryptedValueB64 = decryptedPassword;
    } else {
      let nonce = null;
      let localKeyCrypto = null;
      let value = null;

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

        value = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce.ArrayBuffer },
          localKeyCrypto,
          StringToArrayBuffer(decryptedPassword)
        );

        const encryptedValue = EncryptBytes(nonce.ArrayBuffer, value);
        encryptedValueB64 = ArrayBufferToBase64(encryptedValue);
      } catch (e) {
        showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
        await CatchError(e);
        return;
      } finally {
        nonce = null;
        localKeyCrypto = null;
        value = null;
      }
    }

    decryptedPassword = '';
  }

  const actionData = {
    action: REQUEST_ACTIONS.AUTOFILL,
    username: item.content.username,
    target: REQUEST_TARGETS.CONTENT,
    cryptoAvailable: cryptoAvailableRes.cryptoAvailable
  };

  if (passwordDecrypt) {
    actionData.password = encryptedValueB64;
  }

  encryptedValueB64 = null;
  let res;

  try {
    res = await sendMessageToAllFrames(tab.id, actionData);
  } catch (e) {
    await CatchError(e);
  }

  if (!res) {
    showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleAutofillNoResponse, { additional: { func: 'handleLoginAutofill' } }));
    return;
  }

  const isOk = res.some(frameResponse => frameResponse.status === 'ok');

  if (isOk) {
    const separateWindow = await popupIsInSeparateWindow();

    if (!passwordDecrypt && needsFetchPassword) {
      showToast(browser.i18n.getMessage('this_tab_autofill_fetch_password'), 'info');
    } else if (!passwordDecrypt) {
      showToast(browser.i18n.getMessage('this_tab_autofill_no_password'), 'info');
    } else if (!separateWindow) {
      await closeWindowIfNotInSeparateWindow(separateWindow);
    } else {
      showToast(browser.i18n.getMessage('this_tab_autofill_success'), 'success');
    }
  } else {
    showToast(browser.i18n.getMessage('this_tab_can_t_find_inputs'), 'info');
  }
};

export default handleLoginAutofill;
