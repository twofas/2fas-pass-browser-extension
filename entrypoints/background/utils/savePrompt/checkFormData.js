// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decryptValues from './decryptValues';
import isText from '@/partials/functions/isText';

/**
* Function to check if the form data contains the username and password.
* @async
* @param {Object} details - The details of the web request.
* @param {Object} values - Encrypted values to check against.
* @return {Promise<boolean>} A promise that resolves to true if the form data is valid, false otherwise.
*/
const checkFormData = async (details, values) => {
  if (!details || !values) {
    return false;
  }

  let decryptedValues = values;

  if (values.encrypted) {
    decryptedValues = await decryptValues(values);
  }

  if (details?.requestBody?.formData) {
    let formDataString;

    try {
      formDataString = JSON.stringify(details.requestBody.formData);
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.onWebRequestJsonStringifyError, { event: e });
    }

    const hasPassword = formDataString.includes(decryptedValues.password);
    const hasUsername = !decryptedValues.username || formDataString.includes(decryptedValues.username);

    if (hasPassword && hasUsername) {
      return true;
    }
  }

  if (details?.requestBody?.raw && details.requestBody.raw.length > 0 && details.requestBody.raw[0].bytes) {
    let rawBodyString = '';

    try {
      rawBodyString = ArrayBufferToString(details.requestBody.raw[0].bytes);
    } catch {
      return false;
    }

    if (!rawBodyString || rawBodyString.length === 0 || !isText(rawBodyString)) {
      return false;
    }

    const hasPassword = rawBodyString.includes(decryptedValues.password);
    const hasUsername = !decryptedValues.username || rawBodyString.includes(decryptedValues.username);

    if (hasPassword && hasUsername) {
      return true;
    }

    try {
      const decodedBody = decodeURIComponent(rawBodyString);

      if (decodedBody !== rawBodyString) {
        const decodedHasPassword = decodedBody.includes(decryptedValues.password);
        const decodedHasUsername = !decryptedValues.username || decodedBody.includes(decryptedValues.username);

        if (decodedHasPassword && decodedHasUsername) {
          return true;
        }
      }
    } catch {}
  }

  return false;
};

export default checkFormData;
