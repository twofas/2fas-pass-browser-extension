// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import trimString from './trimString';
import trimNote from './trimNote';

const PASSWORD_KEYS = new Set(['s_password', 's_wifi_password']);
const NOTE_KEYS = new Set(['notes', 's_text', 'additionalInfo']);

/**
* Function to check if a value is a plain object (not an array, a date, a buffer or a class instance).
* @param {*} value - The value.
* @return {boolean} True for a plain object.
*/
const isPlainObject = value => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
};

/**
* Function to trim one value of the content by its key: passwords are kept as they are and notes keep their empty lines.
* @param {string} key - The key of the value.
* @param {*} value - The value.
* @return {*} The trimmed value.
*/
const trimContentValue = (key, value) => {
  if (PASSWORD_KEYS.has(key)) {
    return value;
  }

  if (NOTE_KEYS.has(key)) {
    return trimNote(value);
  }

  return trimItemContent(value);
};

/**
* Function to get a copy of the content of an item sent to the phone (addData, updateData) with the whitespace removed
* around every text value: plain fields, the username field ({ value, action }), the URLs and the secrets. Passwords
* (the login and the Wi-Fi password) are never changed. Notes (notes, Secure Note text, additional info) lose only the
* spaces and tabs around them, so their empty lines at the start and the end are kept. Objects that are not plain objects
* are kept as they are.
* @param {*} content - The content of the item.
* @return {*} The trimmed copy of the content.
*/
const trimItemContent = content => {
  if (Array.isArray(content)) {
    return content.map(trimItemContent);
  }

  if (isPlainObject(content)) {
    return Object.fromEntries(Object.entries(content).map(([key, value]) => [key, trimContentValue(key, value)]));
  }

  return trimString(content);
};

export default trimItemContent;
