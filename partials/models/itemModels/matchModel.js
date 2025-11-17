// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Login from './Login.js';
import SecureNote from './SecureNote.js';

const modelClasses = [Login, SecureNote];
const models = new Map(
  modelClasses
    .filter(Model => Model.contentType)
    .map(Model => [Model.contentType, Model])
);

/**
 * Checks if the itemData has a contentType and contentVersion that match any of the available models
 * and validates that the model constructor doesn't throw errors.
 * If itemData is already a model instance (Login, SecureNote, etc.), returns it directly.
 * @param {Object|Login|SecureNote} itemData - The item data to check or an existing model instance
 * @returns {Login|SecureNote|null} Model instance if valid, null otherwise
 */
const matchModel = itemData => {
  if (!itemData?.contentType) {
    return null;
  }

  if (itemData?.constructor?.name === 'Login' || itemData?.constructor?.name === 'SecureNote') {
    return itemData;
  }

  const Model = models.get(itemData.contentType);

  if (!Model) {
    return null;
  }

  if (Model.contentVersion !== itemData.contentVersion) {
    return null;
  }

  try {
    return new Model(itemData);
  } catch {
    return null;
  }
};

export default matchModel;
