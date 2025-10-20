// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import saveItems from './saveItems';
import saveTags from './saveTags';
import filterVault from '@/partials/models/filterVault';

/** 
* Saves vaults to storage.
* @param {Array} vaultsData - Array of vault data to be saved.
* @param {string} deviceId - The ID of the device associated with the vaults.
* @return {Promise<boolean>} True if the vaults were saved successfully, false otherwise.
*/
const saveVaults = async (vaultsData, deviceId) => {
  const vaultsStorageData = [];
  const correctVaultsData = vaultsData.filter(filterVault);

  for (const vault of correctVaultsData) {
    vaultsStorageData.push({ id: vault.id, name: vault.name });

    await saveItems(vault.items, vault.id, deviceId);
    await saveTags(vault.tags, vault.id, deviceId);
  }

  const devices = await storage.getItem('local:devices') || [];
  const device = devices.find(d => d?.id === deviceId);

  if (device) {
    device.vaults = device.vaults || [];
    device.vaults.push(...correctVaultsData.map(v => ({ id: v.id, name: v.name })));
    await storage.setItem(`local:devices`, devices);
  }

  return true;
};

export default saveVaults;
