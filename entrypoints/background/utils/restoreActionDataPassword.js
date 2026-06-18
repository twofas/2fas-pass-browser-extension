// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { decryptValueFromTransmission } from '@/partials/functions';

/**
* Unwraps an autofill password that was kept encrypted with the local key while it sat in
* session storage (finding #5). When the target page lacks crypto.subtle the content script
* cannot decrypt the value itself, so the password must be handed over as plaintext — this
* restores it just before transmission. When the page can decrypt (cryptoAvailable), the
* password stays encrypted and is forwarded untouched, so this is a no-op.
* Mutates actionData in place: replaces the password with plaintext and drops the marker.
* @async
* @param {Object} actionData - The autofill action data loaded from session storage.
* @return {Promise<{status: string}>} 'ok' when nothing was needed or the unwrap succeeded, 'error' otherwise.
*/
const restoreActionDataPassword = async actionData => {
  if (!actionData?.passwordEncryptedAtRest) {
    return { status: 'ok' };
  }

  const result = await decryptValueFromTransmission(actionData.password);

  if (result.status !== 'ok') {
    return { status: 'error' };
  }

  actionData.password = result.data;
  delete actionData.passwordEncryptedAtRest;

  return { status: 'ok' };
};

export default restoreActionDataPassword;
