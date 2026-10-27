// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decryptValues from './decryptValues';
import parseRequestBody from './parseRequestBody';

/**
* Function to check if the request body carries the captured username and password. The password must be present
* exactly; the username is compared trimmed and case-insensitively, because sites often lowercase or trim the login
* before sending it.
* @async
* @param {Object} details - The details of the web request.
* @param {Object} values - The captured values, possibly encrypted.
* @param {string[]} [bodyTexts] - The texts of the body from parseRequestBody, when the caller already parsed it.
* @return {Promise<boolean>} A promise that resolves to true if the body carries the values, false otherwise.
*/
const checkFormData = async (details, values, bodyTexts) => {
  if (!details || !values) {
    return false;
  }

  let decryptedValues = values;

  if (values.usernameEncrypted || values.passwordEncrypted) {
    decryptedValues = await decryptValues(values);
  }

  const password = decryptedValues?.password;

  if (typeof password !== 'string' || password.length <= 0) {
    return false;
  }

  const texts = Array.isArray(bodyTexts) ? bodyTexts : parseRequestBody(details).texts;

  if (texts.length <= 0 || !texts.some(text => text.includes(password))) {
    return false;
  }

  const username = typeof decryptedValues?.username === 'string' ? decryptedValues.username.trim().toLowerCase() : '';

  if (!username) {
    return true;
  }

  return texts.some(text => text.toLowerCase().includes(username));
};

export default checkFormData;
