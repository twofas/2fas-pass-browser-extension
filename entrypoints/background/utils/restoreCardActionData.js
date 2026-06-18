// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { decryptValueFromTransmission } from '@/partials/functions';

const CARD_SIF_FIELDS = ['cardNumber', 'expirationDate', 'securityCode'];

/**
* Card counterpart of restoreActionDataPassword (finding #5). Reverses protectCardActionData:
* just before transmission to the frames it decrypts the at-rest-encrypted card SIF fields back
* to plaintext (a page without crypto.subtle cannot decrypt them itself) and drops the marker.
* No-op when the fields were never wrapped at rest (crypto available, or no SIF fields). On any
* decryption failure it aborts so ciphertext is never sent as a plaintext value.
* Mutates actionData in place.
* @async
* @param {Object} actionData - The card autofill action data loaded from session storage.
* @return {Promise<{status: string}>} 'ok' when nothing was needed or the unwrap succeeded, 'error' otherwise.
*/
const restoreCardActionData = async actionData => {
  if (!actionData?.cardFieldsEncryptedAtRest) {
    return { status: 'ok' };
  }

  for (const field of CARD_SIF_FIELDS) {
    if (!actionData[field]) {
      continue;
    }

    const result = await decryptValueFromTransmission(actionData[field]);

    if (result.status !== 'ok') {
      return { status: 'error' };
    }

    actionData[field] = result.data;
  }

  delete actionData.cardFieldsEncryptedAtRest;

  return { status: 'ok' };
};

export default restoreCardActionData;
