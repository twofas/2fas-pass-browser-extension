// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab, tabIsInternal, getLastActiveTab, popupIsInSeparateWindow, closeWindowIfNotInSeparateWindow, generateNonce } from '@/partials/functions';
import getItems from '@/partials/sessionStorage/getItems';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import { PULL_REQUEST_TYPES } from '@/constants';

/** 
* Function to handle the autofill action.
* @async
* @param {number} id - The ID of the item.
* @param {function} navigate - The navigate function.
* @param {boolean} more - Indicates if more actions are available.
* @param {function} setMore - Function to update the more state.
* @return {Promise<void>}
*/
const handleAutofill = async (id, navigate, more, setMore) => {
  let itemsStorage, item, res;
  let passwordDecrypt = true;
  let passwordAvailable = true;

  if (more) {
    setMore(false);
  }

  try {
    itemsStorage = await getItems();
    item = itemsStorage.find(item => item.id === id);
  } catch (e) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(e);
    return;
  }

  if (!item) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleAutofillNoService, { additional: { func: 'handleAutofill' } }));
    return;
  }

  let tab;

  try {
    tab = await getLastActiveTab(() => {
      if (item?.securityType === SECURITY_TIER.HIGHLY_SECRET) {
        showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2'), 'info');
      } else {
        showToast(browser.i18n.getMessage('this_tab_can_t_autofill'), 'info');
      }
    }, tab => !tabIsInternal(tab));
  } catch (e) {
    await CatchError(e);
  }

  if (!tab) {
    return;
  }

  try {
    await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT);
  } catch (e) {
    if (item?.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2'), 'info');
    } else {
      showToast(browser.i18n.getMessage('this_tab_can_t_autofill'), 'info');
    }

    if (!e.message.includes('showing error page')) {
      await CatchError(e);
    }

    return;
  }

  const cryptoAvailableRes = await sendMessageToTab(tab.id, {
    action: REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE,
    target: REQUEST_TARGETS.CONTENT
  });

  if (item?.securityType === SECURITY_TIER.HIGHLY_SECRET) {
    if (!item?.password || item?.password?.length <= 0) {
      let canAutofill = false;
      let canAutofillPassword, canAutofillUsername;

      try {
        const inputTests = await sendMessageToAllFrames(tab.id, {
          action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS,
          target: REQUEST_TARGETS.CONTENT
        });

        canAutofillPassword = inputTests.some(input => input.canAutofillPassword);
        canAutofillUsername = inputTests.some(input => input.canAutofillUsername);

        canAutofill = canAutofillPassword || canAutofillUsername;
      } catch {
        canAutofill = false;
      }

      if (!canAutofill) {
        showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2'), 'info');
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
                tabId: tab.id,
                cryptoAvailable: cryptoAvailableRes.cryptoAvailable
              }
            }
          }
        );

        return;
      } else {
        passwordAvailable = false;
      }
    }
  } else if (item?.securityType === SECURITY_TIER.SECRET) {
    if ((!item?.password || item?.password?.length <= 0) && (item?.username && item?.username?.length > 0)) {
      passwordDecrypt = false;
    } else if ((!item?.password || item?.password?.length <= 0) && (!item?.username || item?.username?.length <= 0)) {
      showToast(browser.i18n.getMessage('this_tab_autofill_no_username_and_password'), 'error');
      return;
    }
  }

  let decryptedPassword = '';
  let encryptedValueB64;

  if (passwordAvailable && passwordDecrypt) {
    try {
      const decryptedValue = await item.decryptSif();
      decryptedPassword = decryptedValue.password;
    } catch (e) {
      showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
      await CatchError(e);
      return;
    }
  }

  if (passwordAvailable) {
    if (cryptoAvailableRes.status !== 'ok' || !cryptoAvailableRes.cryptoAvailable) {
      encryptedValueB64 = decryptedPassword;
    } else {
      try {
        const nonce = generateNonce();
        const localKey = await storage.getItem('local:lKey');
        const localKeyCrypto = await crypto.subtle.importKey(
          'raw',
          Base64ToArrayBuffer(localKey),
          { name: 'AES-GCM' },
          false,
          ['encrypt']
        );
      
        const value = await crypto.subtle.encrypt(
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
      }
    }
  }

  const actionData = {
    action: REQUEST_ACTIONS.AUTOFILL,
    username: item.username,
    target: REQUEST_TARGETS.CONTENT,
    cryptoAvailable: cryptoAvailableRes.cryptoAvailable
  };

  if (passwordAvailable) {
    actionData.password = encryptedValueB64;
  }

  try {
    res = await sendMessageToAllFrames(tab.id, actionData);
  } catch {}

  if (!res) {
    showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleAutofillNoResponse, { additional: { func: 'handleAutofill' } }));
    return;
  }

  const isOk = res.filter(frameResponse => frameResponse.status === 'ok').length > 0;

  if (isOk) {
    const separateWindow = await popupIsInSeparateWindow();

    if (!passwordDecrypt) {
      showToast(browser.i18n.getMessage('this_tab_autofill_no_password'), 'info');
    } else {
      if (!separateWindow) {
        await closeWindowIfNotInSeparateWindow(separateWindow);  
      } else {
        showToast(browser.i18n.getMessage('this_tab_autofill_success'), 'success');
      }
    }
  } else {
    showToast(browser.i18n.getMessage('this_tab_can_t_find_inputs'), 'info');
  }
};

export default handleAutofill;
