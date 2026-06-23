// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getConfigured from './getConfigured';

/**
* Gets the configured boolean value.
* @async
* @return {Promise<boolean>} The configured boolean value.
*/
const getConfiguredBoolean = async () => {
  try {
    const configuredValue = await getConfigured();
    return configuredValue < Date.now();
  } catch {
    // getConfigured() throws only when the configured state cannot be verified
    // (crypto/decrypt failure - e.g. keys or storage env no longer match the
    // data). Reporting "configured" here based on session:storageVersion would
    // mask that invalid state and show an empty item list instead of the honest
    // locked/reconnect screen. A genuinely-absent configured value does NOT throw
    // (getConfigured returns a far-future default), so this only affects real errors.
    return false;
  }
};

export default getConfiguredBoolean;
