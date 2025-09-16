// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import getCurrentDevice from '@/partials/functions/getCurrentDevice';

const decryptData = async encryptedData => {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return {};
    }

    const lKey = await storage.getItem('local:lKey');

    if (!lKey) {
      try {
        return JSON.parse(encryptedData);
      } catch {
        return {};
      }
    }

    const combined = Base64ToArrayBuffer(encryptedData);
    const { iv: nonce, data: ciphertext } = DecryptBytes(combined);

    let localKeyCrypto;

    try {
      localKeyCrypto = await crypto.subtle.importKey(
        'raw',
        Base64ToArrayBuffer(lKey),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateDecryptImportKeyError, {
        event: e,
        additional: { func: 'getPopupStateObjectForTab - decryptData - importKey' }
      });
    }

    let decryptedValue;

    try {
      decryptedValue = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce },
        localKeyCrypto,
        ciphertext
      );
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateDecryptError, {
        event: e,
        additional: { func: 'getPopupStateObjectForTab - decryptData - decrypt' }
      });
    }

    const dataString = ArrayBufferToString(decryptedValue);

    return JSON.parse(dataString);
  } catch (error) {
    CatchError(error);

    try {
      return JSON.parse(encryptedData);
    } catch {
      return {};
    }
  }
};

/**
* Retrieves the popup state object for a specific tab.
* @param {string} tabId - The ID of the tab for which to retrieve the popup state object.
* @return {Promise<Object|null>} The popup state object or null if not found.
*/
const getPopupStateObjectForTab = async tabId => {
  try {
    let device;

    try {
      device = await getCurrentDevice();
    } catch {}

    if (!device?.uuid) {
      return null;
    }

    let storageKey;

    try {
      storageKey = await getKey('popup_state', { uuid: device.uuid });
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateGetKeyError, {
        event: e,
        additional: { func: 'getPopupStateObjectForTab - getKey' }
      });
    }

    if (!storageKey) {
      return null;
    }

    let popupState;
    
    try {
      popupState = await storage.getItem(`session:${storageKey}`);
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateStorageError, {
        event: e,
        additional: { func: 'getPopupStateObjectForTab - getItem' }
      });
    }

    const tabPopupState = popupState?.[tabId];

    if (!tabPopupState) {
      return null;
    }

    const decryptedData = await decryptData(tabPopupState.data);

    return {
      ...tabPopupState,
      data: decryptedData
    };
  } catch (error) {
    CatchError(error);
    return null;
  }
};

export default getPopupStateObjectForTab;
