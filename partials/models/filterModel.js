// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Login from '@/partials/models/Login.js';
import SecureNote from '@/partials/models/SecureNote.js';

const modelClasses = [Login, SecureNote];
const models = new Map(
  modelClasses
    .filter(Model => Model.contentType)
    .map(Model => [Model.contentType, Model])
);

/**
 * Checks if the itemData has a contentType and contentVersion that match any of the available models
 * and validates that the model constructor doesn't throw errors
 * @param {Object} itemData - The item data to check
 * @returns {boolean} True if contentType and contentVersion match a model and validation passes, false otherwise
 */
const filterModel = itemData => {
  if (!itemData?.contentType) {
    return false;
  }

  const Model = models.get(itemData.contentType);

  if (!Model) {
    return false;
  }

  if (Model.contentVersion !== itemData.contentVersion) {
    return false;
  }

  try {
    new Model(itemData);
    return true;
  } catch {
    // @TODO: log error?
    return false;
  }
};

export default filterModel;
