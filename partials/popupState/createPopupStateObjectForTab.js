// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import getCurrentDevice from '@/partials/functions/getCurrentDevice';
import generateNonce from '@/partials/functions/generateNonce';

const encryptData = async data => {
  try {
    const lKey = await storage.getItem('local:lKey');

    if (!lKey) {
      return JSON.stringify(data);
    }

    let nonce;

    try {
      nonce = await generateNonce();
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateEncryptNonceError, {
        event: e,
        additional: { func: 'createPopupStateObjectForTab - encryptData - generateNonce' }
      });
    }

    const dataString = JSON.stringify(data);

    let localKeyCrypto;

    try {
      localKeyCrypto = await crypto.subtle.importKey(
        'raw',
        Base64ToArrayBuffer(lKey),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateEncryptImportKeyError, {
        event: e,
        additional: { func: 'createPopupStateObjectForTab - encryptData - importKey' }
      });
    }

    let encryptedValue;

    try {
      encryptedValue = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce.ArrayBuffer },
        localKeyCrypto,
        StringToArrayBuffer(dataString)
      );
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateEncryptError, {
        event: e,
        additional: { func: 'createPopupStateObjectForTab - encryptData - encrypt' }
      });
    }

    const combined = EncryptBytes(nonce.ArrayBuffer, encryptedValue);

    return ArrayBufferToBase64(combined);
  } catch (error) {
    CatchError(error);
    return JSON.stringify(data);
  }
};

/**
* Creates a popup state object for a specific tab.
* @param {string} tabId - The ID of the tab for which to create the popup state object.
* @return {Promise<void>} A promise that resolves when the popup state object has been created.
*/
const createPopupStateObjectForTab = async tabId => {
  try {
    let device;

    try {
      device = await getCurrentDevice();
    } catch {}

    if (!device?.uuid) {
      return;
    }

    let storageKey;

    try {
      storageKey = await getKey('popup_state', { uuid: device.uuid });
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateGetKeyError, {
        event: e,
        additional: { func: 'createPopupStateObjectForTab - getKey' }
      });
    }

    if (!storageKey) {
      return;
    }

    let popupState;
    
    try {
      popupState = await storage.getItem(`session:${storageKey}`);
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateStorageError, {
        event: e,
        additional: { func: 'createPopupStateObjectForTab - getItem' }
      });
    }

    if (!popupState || typeof popupState !== 'object') {
      popupState = {};
    }

    if (!popupState[tabId]) {
      const encryptedData = await encryptData({});

      popupState[tabId] = {
        data: encryptedData,
        scrollPosition: 0,
        href: ''
      };

      try {
        await storage.setItem(`session:${storageKey}`, popupState);
      } catch (e) {
        throw new TwoFasError(TwoFasError.internalErrors.popupStateStorageError, {
          event: e,
          additional: { func: 'createPopupStateObjectForTab - setItem' }
        });
      }
    }
  } catch (error) {
    throw new TwoFasError(TwoFasError.internalErrors.popupStateCreateError, {
      event: error,
      additional: { func: 'createPopupStateObjectForTab', tabId }
    });
  }
};

export default createPopupStateObjectForTab;
