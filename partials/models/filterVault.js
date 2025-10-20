// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Vault from './Vault';

/** 
* Filters vault data to ensure it conforms to the Vault model.
* @param {Object} vault - The vault data to filter.
* @return {boolean} True if the vault data is valid, false otherwise.
*/
const filterVault = vault => {
  try {
    new Vault(vault);
    return true;
  } catch {
    return false;
  }
};

export default filterVault;