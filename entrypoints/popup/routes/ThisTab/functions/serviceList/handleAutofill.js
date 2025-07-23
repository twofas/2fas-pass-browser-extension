// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';
import sendMessageToTab from '@/partials/functions/sendMessageToTab';
import tabIsInternal from '@/partials/functions/tabIsInternal';
import getServices from '@/partials/sessionStorage/getServices';
import getLastActiveTab from '@/partials/functions/getLastActiveTab';
import decryptPassword from '@/partials/functions/decryptPassword';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import closeWindowIfNotInSeparateWindow from '@/partials/functions/closeWindowIfNotInSeparateWindow';
import generateNonce from '@/partials/functions/generateNonce';
import PULL_REQUEST_TYPES from '../../../Fetch/constants/PULL_REQUEST_TYPES';

/** 
* Function to handle the autofill action.
* @async
* @param {number} id - The ID of the service.
* @param {function} navigate - The navigate function.
* @param {boolean} more - Indicates if more actions are available.
* @param {function} setMore - Function to update the more state.
* @return {Promise<void>}
*/
const handleAutofill = async (id, navigate, more, setMore) => {
  let servicesStorage, service, res;
  let passwordDecrypt = true;

  if (more) {
    setMore(false);
  }

  try {
    servicesStorage = await getServices();
    service = servicesStorage.find(service => service.id === id);
  } catch (e) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(e);
    return;
  }

  if (!service) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleAutofillNoService, { additional: { func: 'handleAutofill' } }));
    return;
  }

  let tab;

  try {
    tab = await getLastActiveTab(() => {
      showToast(browser.i18n.getMessage('this_tab_can_t_autofill'), 'info');
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
    showToast(browser.i18n.getMessage('this_tab_can_t_autofill'), 'info');

    if (!e.message.includes('showing error page')) {
      await CatchError(e);
    }

    return;
  }

  const cryptoAvailableRes = await sendMessageToTab(tab.id, {
    action: REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE,
    target: REQUEST_TARGETS.CONTENT
  });

  if (service?.securityType === SECURITY_TIER.HIGHLY_SECRET) {
    if (!service?.password || service?.password?.length <= 0) {
      let canAutofill = false;

      try {
        const inputTests = await sendMessageToAllFrames(tab.id, {
          action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS,
          target: REQUEST_TARGETS.CONTENT
        });
        canAutofill = inputTests.some(inputTest => inputTest === true);
      } catch {
        canAutofill = false;
      }

      if (!canAutofill) {
        showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2'), 'info');
        return;
      }

      navigate(
        '/fetch', {
          state: {
            action: PULL_REQUEST_TYPES.PASSWORD_REQUEST,
            from: 'autofill',
            data: {
              loginId: service.id,
              deviceId: service.deviceId,
              tabId: tab.id,
              cryptoAvailable: cryptoAvailableRes.cryptoAvailable
            }
          }
        }
      );

      return;
    }
  } else if (service?.securityType === SECURITY_TIER.SECRET) {
    if ((!service?.password || service?.password?.length <= 0) && (service?.username && service?.username?.length > 0)) {
      passwordDecrypt = false;
    } else if ((!service?.password || service?.password?.length <= 0) && (!service?.username || service?.username?.length <= 0)) {
      showToast(browser.i18n.getMessage('this_tab_autofill_no_username_and_password'), 'error');
      return;
    }
  }

  let decryptedPassword = '';
  let encryptedValueB64;

  if (passwordDecrypt) {
    try {
      decryptedPassword = await decryptPassword(service);
    } catch (e) {
      showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
      await CatchError(e);
      return;
    }
  }

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

  try {
    res = await sendMessageToAllFrames(tab.id, {
      action: REQUEST_ACTIONS.AUTOFILL,
      username: service.username,
      password: encryptedValueB64,
      target: REQUEST_TARGETS.CONTENT,
      cryptoAvailable: cryptoAvailableRes.cryptoAvailable
    });
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
