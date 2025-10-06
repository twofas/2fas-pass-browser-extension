// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Validates if a value is a valid UUID string.
 * @param {*} value - The value to validate.
 * @return {boolean} True if the value is a valid UUID, false otherwise.
 */
export const isValidUUID = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/**
 * Validates if a value is a valid base64 string.
 * @param {*} value - The value to validate.
 * @return {boolean} True if the value is a valid base64 string, false otherwise.
 */
export const isValidBase64 = value => typeof value === 'string' && /^[A-Za-z0-9+/]+=*$/.test(value);

/**
 * Validates if a value is a valid hex color string (3 or 6 characters).
 * @param {*} value - The value to validate.
 * @return {boolean} True if the value is a valid hex color, false otherwise.
 */
export const isValidHexColor = value => typeof value === 'string' && /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);

/**
 * Validates if a value is an integer within an optional range.
 * @param {*} value - The value to validate.
 * @param {number} [min] - Optional minimum value (inclusive).
 * @param {number} [max] - Optional maximum value (inclusive).
 * @return {boolean} True if the value is a valid integer within the specified range, false otherwise.
 */
export const isValidInteger = (value, min, max) => {
  if (!Number.isInteger(value)) {
    return false;
  }

  if (min !== undefined && value < min) {
    return false;
  }

  if (max !== undefined && value > max) {
    return false;
  }

  return true;
};

/**
 * Validates if a value is a string.
 * @param {*} value - The value to validate.
 * @param {boolean} [allowEmpty=true] - Whether to allow empty strings.
 * @return {boolean} True if the value is a valid string, false otherwise.
 */
export const isValidString = (value, allowEmpty = true) => {
  if (typeof value !== 'string') {
    return false;
  }

  if (!allowEmpty && value.length === 0) {
    return false;
  }

  return true;
};

/**
 * Validates if a value is an array.
 * @param {*} value - The value to validate.
 * @param {Function} [elementValidator] - Optional validator function for array elements.
 * @return {boolean} True if the value is a valid array, false otherwise.
 */
export const isValidArray = (value, elementValidator = null) => {
  if (!Array.isArray(value)) {
    return false;
  }

  if (elementValidator && typeof elementValidator === 'function') {
    return value.every(elementValidator);
  }

  return true;
};
