// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to tell whether the inputs captured in a tab hold both a username and a password value from the given page
* origin — the pair a login or sign-up submission needs.
* @param {Object} tabInputs - The captured inputs of the tab, keyed by input ID.
* @param {string} origin - The origin of the page that sent the request.
* @return {boolean} True when both values are present.
*/
const hasCredentialPairForOrigin = (tabInputs, origin) => {
  if (!tabInputs || !origin) {
    return false;
  }

  let hasUsername = false;
  let hasPassword = false;

  Object.values(tabInputs).forEach(inputData => {
    if (inputData?.url !== origin || !inputData?.value) {
      return;
    }

    if (inputData.type === 'username') {
      hasUsername = true;
    }

    if (inputData.type === 'password') {
      hasPassword = true;
    }
  });

  return hasUsername && hasPassword;
};

export default hasCredentialPairForOrigin;
