// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const HIDDEN_VALUE_REGEX = /^([^\p{L}\p{N}\p{M}_])\1+$/u;
const DIGITS_ONLY_REGEX = /^\d+$/;
const MIN_DIGITS_USERNAME_LENGTH = 3;

/**
* Tells whether a password field value is the site's mask rather than the password: one non-alphanumeric
* symbol repeated (e.g. "••••••"), after Chromium's password manager kHiddenValueRe.
* @param {string} value - The field value.
* @return {boolean} True if the value only hides the password.
*/
const isHiddenPasswordValue = value => HIDDEN_VALUE_REGEX.test(String(value || ''));

/**
* Tells whether a username field value cannot be a username: empty, or one or two digits, after Chromium's
* password manager IsProbablyNotUsername.
* @param {string} value - The field value.
* @return {boolean} True if the value is not a username.
*/
const isProbablyNotUsername = value => {
  const text = String(value || '');

  return text.length === 0 || (text.length < MIN_DIGITS_USERNAME_LENGTH && DIGITS_ONLY_REGEX.test(text));
};

export { isHiddenPasswordValue, isProbablyNotUsername };
