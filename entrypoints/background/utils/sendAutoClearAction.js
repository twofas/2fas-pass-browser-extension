// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLocalKey from './getLocalKey';
import { generateNonce, sendMessageToTab } from '@/partials/functions';

/**
* Sends an auto-clear action to content scripts and popup to clear the clipboard.
* The value is encrypted before transmission if crypto is available.
* @async
* @param {string} value - The item value to compare with clipboard ('addNew' for new items, or the actual value from items like password, username, uri, name, text, cardNumber, expirationDate, securityCode, cardHolder).
* @param {boolean} cryptoAvailable - Indicates if cryptographic functions are available.
* @param {Object} sender - The message sender object containing tab information.
* @return {Promise<boolean|void>} A promise that resolves to false on error, or void on success.
*/
const sendAutoClearAction = async (value, cryptoAvailable, sender) => {
  if (!value) {
    return false;
  }
  
  const data = {
    action: REQUEST_ACTIONS.AUTO_CLEAR_ACTION,
    cryptoAvailable
  };

  if (value === 'addNew') {
    data.value = 'addNew';
  } else {
    if (!cryptoAvailable) {
      data.value = value;
    } else {
      const [localKey, nonce] = await Promise.all([
        getLocalKey(),
        generateNonce('arraybuffer')
      ]).catch(() => {
        return false;
      });

      if (!localKey || !nonce) {
        return false;
      }

      let localKeyCrypto;

      try {
        localKeyCrypto = await crypto.subtle.importKey('raw', Base64ToArrayBuffer(localKey), { name: 'AES-GCM' }, false, ['encrypt'] );
      } catch {
        return false;
      }

      let encryptedValue;

      try {
        encryptedValue = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce.ArrayBuffer },
          localKeyCrypto,
          StringToArrayBuffer(value)
        );
      } catch {
        return false;
      }

      const encryptedValueEB = EncryptBytes(nonce.ArrayBuffer, encryptedValue);
      const encryptedValueB64 = ArrayBufferToBase64(encryptedValueEB);
      data.value = encryptedValueB64;
    }
  }

  const res = await Promise.all([
    sendMessageToTab(sender.tab.id, { ...data, target: REQUEST_TARGETS.FOCUS_CONTENT }),
    sendMessageToTab(sender.tab.id, { ...data, target: REQUEST_TARGETS.POPUP })
  ]);

  if (res && res.some(r => r?.status === 'ok')) {
    await storage.setItem('session:autoClearActions', []);
  }
};

export default sendAutoClearAction;
