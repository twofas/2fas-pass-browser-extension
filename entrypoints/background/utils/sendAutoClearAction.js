// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLocalKey from './getLocalKey';
import { generateNonce, sendMessageToTab } from '@/partials/functions';

/** 
* Brief description of the function here.
* @param {string} value - Value to be processed, can be a string or an object.
* @param {boolean} cryptoAvailable - Indicates if cryptographic functions are available.
* @return {Promise<void>} A promise that resolves when the action is sent.
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

  await sendMessageToTab(sender.tab.id, { ...data, target: REQUEST_TARGETS.FOCUS_CONTENT });
  await sendMessageToTab(sender.tab.id, { ...data, target: REQUEST_TARGETS.POPUP });
};

export default sendAutoClearAction;
