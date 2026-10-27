// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { refreshLocalKey } from './ensureLocalKey';

/**
* Creates a check, called on user interaction, that fetches the current local key when the page has been idle longer
* than the interval. The background rotates the key on every lock, and a lock needs the user to be away, so the first
* key press or click after it fetches the new key before a submission is encrypted. Waiting for the background to refuse
* the old key (staleKey) is too late for a form whose submission navigates away.
* @param {Object} localKey - Shared key holder ({ data: CryptoKey|null, keyId: string|null }).
* @param {number} interval - Idle time in milliseconds after which the key is fetched again.
* @return {Function} The check to call on user interaction.
*/
const createLocalKeyFreshnessCheck = (localKey, interval) => {
  let lastCheck = Date.now();

  return () => {
    const now = Date.now();

    if (now - lastCheck <= interval) {
      lastCheck = now;
      return;
    }

    lastCheck = now;
    refreshLocalKey(localKey).catch(() => {});
  };
};

export default createLocalKeyFreshnessCheck;
