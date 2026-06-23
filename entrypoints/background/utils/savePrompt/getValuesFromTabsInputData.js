// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to extract username and password from tabs input data.
* The encryption state is reported per field (usernameEncrypted / passwordEncrypted)
* rather than as a single global flag taken from the password entry, so a mixed set
* (one field encrypted, the other plaintext) can be resolved field-by-field by the
* downstream decrypt step instead of all-or-nothing (finding #41).
* @param {Object} tabsInputData - The input data from the tabs.
* @return {Object} An object with the extracted username, password and their per-field encryption flags.
*/
const getValuesFromTabsInputData = tabsInputData => {
  let username, password;
  let usernameEncrypted = false;
  let passwordEncrypted = false;

  if (!tabsInputData || tabsInputData.length <= 0) {
    return { username, password, usernameEncrypted, passwordEncrypted };
  }

  const tabInputsIds = Object.keys(tabsInputData);

  tabInputsIds.forEach(id => {
    const input = tabsInputData[id];

    if (input?.type && input?.value && input?.type === 'username') {
      username = input?.value;
      usernameEncrypted = input?.encrypted || false;
    }

    if (input?.type && input?.value && input?.type === 'password') {
      password = input?.value;
      passwordEncrypted = input?.encrypted || false;
    }
  });

  return {
    username,
    password,
    usernameEncrypted,
    passwordEncrypted
  };
};

export default getValuesFromTabsInputData;
