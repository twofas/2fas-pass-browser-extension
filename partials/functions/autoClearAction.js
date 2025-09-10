// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to handle auto-clear actions.
* @async
* @param {Object} request - The request object.
* @return {Promise<void>} A promise that resolves when the action is complete.
*/
const autoClearAction = async request => {
  if (request?.value === 'addNew') {
    try {
      await navigator.clipboard.writeText('');
    } catch {}
  } else {
    let actionValue;

    if (!request?.cryptoAvailable) {
      actionValue = request?.value;
    } else {
      let localKeyResponse;

      try {
        localKeyResponse = await browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.GET_LOCAL_KEY,
          target: REQUEST_TARGETS.BACKGROUND
        });
      } catch {
        return false;
      }

      let localKeyCrypto;

      if (localKeyResponse?.status === 'ok' && localKeyResponse?.data && localKeyResponse.data.length > 0) {
        try {
          localKeyCrypto = await crypto.subtle.importKey('raw', Base64ToArrayBuffer(localKeyResponse.data), { name: 'AES-GCM' }, false, ['decrypt'] );
        } catch {
          return false;
        }
      } else {
        return false;
      }

      const valueAB = Base64ToArrayBuffer(request.value);
      const valueDecryptedBytes = DecryptBytes(valueAB);
      let decryptedValueAB;

      try {
        decryptedValueAB = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: valueDecryptedBytes.iv },
          localKeyCrypto,
          valueDecryptedBytes.data
        );
      } catch {
        return false;
      }

      actionValue = ArrayBufferToString(decryptedValueAB);

      try {
        actionValue = JSON.parse(actionValue);
      } catch {}
    }

    const clipboardValue = await navigator.clipboard.readText().catch(() => '');

    if (Array.isArray(actionValue)) {
      if (actionValue.some(value => value === clipboardValue)) {
        try {
          await navigator.clipboard.writeText('');
        } catch {}
      }
    } else if (clipboardValue === actionValue) {
      try {
        await navigator.clipboard.writeText('');
      } catch {}
    }
  }
};

export default autoClearAction;
