// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { encryptValueForTransmission } from '@/partials/functions';

const CARD_SIF_FIELDS = ['cardNumber', 'expirationDate', 'securityCode'];

/**
* Card counterpart of protectActionDataPassword (finding #5). Wraps the sensitive card SIF
* fields (`cardNumber`, `expirationDate`, `securityCode`) with the local key so they never
* sit in session storage as plaintext while a cross-domain dialog is pending. The non-sensitive
* `cardholderName`/`cardIssuer` are left as-is. When the page can run crypto.subtle the fields
* are already local-key encrypted for transport, so this is a no-op. Returns a NEW actionData
* object when wrapping so the caller's in-memory copy stays plaintext for any direct fill that
* does not go through storage. Unwrapped back to plaintext by restoreCardActionData just before
* transmission.
* @async
* @param {Object} actionData - The card autofill action data about to be persisted.
* @return {Promise<{status: string, actionData?: Object}>} 'ok' with the (possibly new) actionData, or 'error'.
*/
const protectCardActionData = async actionData => {
  if (actionData?.cryptoAvailable || actionData?.cardFieldsEncryptedAtRest) {
    return { status: 'ok', actionData };
  }

  const fieldsToProtect = CARD_SIF_FIELDS.filter(field => actionData?.[field]);

  if (fieldsToProtect.length === 0) {
    return { status: 'ok', actionData };
  }

  const protectedActionData = { ...actionData };

  for (const field of fieldsToProtect) {
    const result = await encryptValueForTransmission(protectedActionData[field]);

    if (result.status !== 'ok') {
      return { status: 'error' };
    }

    protectedActionData[field] = result.data;
  }

  protectedActionData.cardFieldsEncryptedAtRest = true;

  return { status: 'ok', actionData: protectedActionData };
};

export default protectCardActionData;
