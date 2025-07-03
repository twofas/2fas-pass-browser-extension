// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import decryptValues from './decryptValues';

/** 
* Function to check if the form data contains the username and password.
* @async
* @param {Object} details - The details of the web request.
* @param {Object} values - Encrypted values to check against.
* @return {Promise<boolean>} A promise that resolves to true if the form data is valid, false otherwise.
*/
const checkFormData = async (details, values) => {
  if (!details || !values) {
    // FUTURE - throw error?
    return false;
  }

  const decryptedValues = await decryptValues(values);

  let formDataOk = false;

  if (details?.requestBody?.formData) {
    let formDataString;

    try {
      formDataString = JSON.stringify(details.requestBody.formData);
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.onWebRequestJsonStringifyError, { event: e });
    }

    if (formDataString.includes(decryptedValues.password) && formDataString.includes(decryptedValues.username)) {
      formDataOk = true;
    }
  }

  return formDataOk;
};

export default checkFormData;
