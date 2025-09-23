// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab, decryptPassword, generateNonce } from '@/partials/functions';
import getServices from '@/partials/sessionStorage/getServices';
import TwofasNotification from '@/partials/TwofasNotification';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';

/** 
* Function to send autofill data to a specific tab.
* @async
* @param {number} tabId - The ID of the tab to which the autofill data should be sent.
* @param {string} serviceID - The ID of the service to use for the autofill data.
* @return {Promise<void>} A promise that resolves when the autofill data is sent.
*/
const sendAutofillToTab = async (tabId, serviceID) => {
  const injectedCS = await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);

  if (!injectedCS) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_autofill_error_message')
    }, tabId, true);
  }

  let services, service;

  try {
    services = await getServices();
    service = services.find(service => service.id === serviceID);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabToTabService, {
      event: e,
      additional: { func: 'sendAutofillToTab - getServices' }
    });
  }

  if (!service) {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_send_autofill_to_tab_lack_of_service_title'),
      Message: browser.i18n.getMessage('notification_send_autofill_to_tab_lack_of_service_message')
    }, tabId, true);
  }

  let noPassword = false;
  let noUsername = false;
  let decryptedPassword, encryptedValueB64;

  if (!service?.password || service?.password?.length <= 0) {
    noPassword = true;
  }

  if (!service?.username || service?.username?.length <= 0) {
    noUsername = true;
  }

  const cryptoAvailableRes = await sendMessageToTab(tabId, {
    action: REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE,
    target: REQUEST_TARGETS.CONTENT
  });

  if (!noPassword) {
    try {
      decryptedPassword = await decryptPassword(service);
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabDecryptPassword, {
        event: e,
        additional: { func: 'sendAutofillToTab - decryptPassword' }
      });
    }

    if (cryptoAvailableRes.status !== 'ok' || !cryptoAvailableRes.cryptoAvailable) {
      encryptedValueB64 = decryptedPassword;
    } else {
      let nonce, localKeyCrypto, value;

      try {
        nonce = await generateNonce();
      } catch (e) {
        throw new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabNonceError, {
          event: e,
          additional: { func: 'sendAutofillToTab - generateNonce' }
        });
      }

      const localKey = await storage.getItem('local:lKey');

      try {
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
          additional: { func: 'sendAutofillToTab - importKey' }
        });
      }

      try {
        value = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce.ArrayBuffer },
          localKeyCrypto,
          StringToArrayBuffer(decryptedPassword)
        );
      } catch (e) {
        throw new TwoFasError(TwoFasError.internalErrors.sendAutofillToTabEncryptError, {
          event: e,
          additional: { func: 'sendAutofillToTab - encrypt' }
        });
      }

      const encryptedValue = EncryptBytes(nonce.ArrayBuffer, value);
      encryptedValueB64 = ArrayBufferToBase64(encryptedValue);
    }
  }

  try {
    const response = await sendMessageToAllFrames(
      tabId,
      {
        action: REQUEST_ACTIONS.AUTOFILL,
        username: service.username,
        password: encryptedValueB64,
        target: REQUEST_TARGETS.CONTENT,
        noPassword,
        noUsername,
        cryptoAvailable: cryptoAvailableRes?.cryptoAvailable
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
