// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getModelsForDevice from './getModelsForDevice.js';

/**
 * Checks if the itemData has a contentType and contentVersion that match any of the available models
 * and validates that the model constructor doesn't throw errors
 * @async
 * @param {Object} itemData - The item data to check
 * @param {string} deviceId - The device ID
 * @param {string} vaultId - The ID of the vault
 * @returns {boolean|Object} True if contentType and contentVersion match a model and validation passes, false otherwise, or the item instance
 */
const mapModel = async (itemData, deviceId, vaultId) => {
  const models = await getModelsForDevice(deviceId);
  console.log('mapModel models:', models);

  if (!itemData?.contentType) {
    console.log('mapModel missing contentType:', itemData);
    return false;
  }

  const Model = models.get(itemData.contentType);
  console.log('mapModel Model:', Model);

  if (!Model) {
    return false;
  }

  if (Model.contentVersion !== itemData.contentVersion) {
    return false;
  }

  if (Model?.name === itemData?.constructor?.name) {
    return itemData;
  }

  try {
    return new Model(itemData, deviceId, vaultId);
  } catch (e) {
    CatchError(e);
    return false;
  }
};

export default mapModel;
