// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Checks if an object is a plain object with properties (not empty)
 * @param {*} obj - Value to check
 * @returns {boolean} - True if object with properties
 */
const isPlainObjectWithProps = obj => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }

  return Object.keys(obj).length > 0;
};

/**
 * Merges overwrites into target object (one level deep for nested objects)
 * @param {Object} target - Target object to merge into
 * @param {Object} overwrites - Object with properties to overwrite
 * @returns {Object} - Merged object
 */
const deepMerge = (target, overwrites) => {
  const result = { ...target };

  for (const key in overwrites) {
    if (Object.prototype.hasOwnProperty.call(overwrites, key)) {
      const overwriteValue = overwrites[key];
      const targetValue = result[key];
      const bothAreObjects = isPlainObjectWithProps(overwriteValue) && isPlainObjectWithProps(targetValue);

      if (bothAreObjects) {
        result[key] = { ...targetValue, ...overwriteValue };
      } else {
        result[key] = overwriteValue;
      }
    }
  }

  return result;
};

/**
 * Updates an item with the provided overwrites
 * @param {Login|SecureNote} baseItem - The base item to update
 * @param {Object} overwrites - Object with properties to overwrite (supports nested properties)
 * @returns {Login|SecureNote} - New item instance with merged data
 */
const updateItem = (baseItem, overwrites = {}) => {
  const itemData = baseItem.toJSON();
  const updatedData = deepMerge(itemData, overwrites);
  const updatedItem = new (baseItem.constructor)(updatedData);

  return updatedItem;
};

export default updateItem;