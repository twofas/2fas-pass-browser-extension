// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { encryptValueForTransmission } from '@/partials/functions';

/**
* Wraps an autofill password with the local key so it never sits in session storage as
* plaintext while a cross-domain dialog is pending (finding #5). Inverse of
* restoreActionDataPassword. When the page can run crypto.subtle the password is already
* local-key encrypted for transport, so it is left untouched; only the plaintext case
* (http:// pages) is wrapped. The decryption is done up front by the caller (so it also
* covers Top/Highly Secret items whose SIF is only briefly available), and the value is
* unwrapped back to plaintext just before transmission.
* Returns a NEW actionData object when wrapping so the caller's in-memory copy stays
* plaintext for any direct-fill fallback that does not go through storage.
* @async
* @param {Object} actionData - The autofill action data about to be persisted.
* @return {Promise<{status: string, actionData?: Object}>} 'ok' with the (possibly new) actionData, or 'error'.
*/
const protectActionDataPassword = async actionData => {
  if (actionData?.cryptoAvailable || !actionData?.password || actionData?.passwordEncryptedAtRest) {
    return { status: 'ok', actionData };
  }

  const result = await encryptValueForTransmission(actionData.password);

  if (result.status !== 'ok') {
    return { status: 'error' };
  }

  return {
    status: 'ok',
    actionData: { ...actionData, password: result.data, passwordEncryptedAtRest: true }
  };
};

export default protectActionDataPassword;
