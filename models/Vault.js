// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

class Vault {
  constructor (vaultData) {
    validate(vaultData && typeof vaultData === 'object', 'Invalid vault data');

    validate(isValidUUID(vaultData.id), 'Invalid or missing id: must be a valid UUID');
    validate(typeof vaultData.name === 'string', `Invalid vaultData.name must be a string`);

    validate(Array.isArray(vaultData.items), 'Invalid or missing vaultData.items: must be an array');
    validate(Array.isArray(vaultData.tags), 'Invalid or missing vaultData.tags: must be an array');

    this.id = vaultData.id;
    this.name = vaultData.name;
  }
}

export default Vault;
