// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getConfigured from './getConfigured';

/** 
* Gets the configured boolean value.
* @async
* @param {string} key - The key to look up.
* @return {Promise<boolean>} The configured boolean value.
*/
const getConfiguredBoolean = async () => {
  try {
    const configuredValue = await getConfigured();
    return configuredValue < new Date().valueOf();
  } catch {
    return false;
  }
};

export default getConfiguredBoolean;
