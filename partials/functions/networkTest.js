// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to perform a network test.
* @param {string} defaultErrorMessage - The default error message to display in case of a network error.
* @return {Promise<string>} A promise that resolves to the appropriate error message.
*/
const networkTest = async defaultErrorMessage => {
  let toastMessage = defaultErrorMessage;

  if (navigator?.onLine && navigator?.onLine === false) {
    toastMessage = 'error_no_network_connection';
  } else {
    let apiTest;

    try {
      apiTest = await fetch(`https://${import.meta.env.VITE_API_URL_ORIGIN}/health`, { method: 'GET' }).catch(() => null);
    } catch {
      apiTest = null;
    }

    if (!apiTest || !apiTest?.ok) {
      toastMessage = 'error_connection_error';
    }
  }

  return toastMessage;
};

export default networkTest;
