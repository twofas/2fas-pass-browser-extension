// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getModelsForDevice from './getModelsForDevice.js';

/**
 * Checks if the itemData has a contentType and contentVersion that match any of the available models
 * and validates that the model constructor doesn't throw errors.
 * If itemData is already a model instance (Login, SecureNote, etc.), returns it directly.
 * @async
 * @param {Object|Login|SecureNote|PaymentCard} itemData - The item data to check or an existing model instance
 * @returns {Login|SecureNote|PaymentCard|null} Model instance if valid, null otherwise
 */
const matchModel = async itemData => {
  if (!itemData?.contentType) {
    return null;
  }

  const Model = itemData?.constructor;

  if (Model?.contentType === itemData.contentType) {
    return itemData;
  }

  const models = await getModelsForDevice(itemData.deviceId);
  const MatchedModel = models.get(itemData.contentType);

  if (!MatchedModel) {
    return null;
  }

  if (MatchedModel.contentVersion !== itemData.contentVersion) {
    return null;
  }

  try {
    return new MatchedModel(itemData);
  } catch {
    return null;
  }
};

export default matchModel;
