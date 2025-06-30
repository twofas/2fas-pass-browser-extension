// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to extract username and password from tabs input data.
* @param {Object} tabsInputData - The input data from the tabs.
* @return {Object} An object containing the extracted username and password.
*/
const getValuesFromTabsInputData = tabsInputData => {
  let username, password;
  
  if (!tabsInputData || tabsInputData.length <= 0) {
    return {
      username,
      password
    };
  }
  
  const tabInputsIds = Object.keys(tabsInputData);

  tabInputsIds.forEach(id => {
    const input = tabsInputData[id];

    if (input?.type && input?.value && input?.type === 'username') {
      username = input?.value;
    }

    if (input?.type && input?.value && input?.type === 'password') {
      password = input?.value;
    }
  });

  return {
    username,
    password
  };
};

export default getValuesFromTabsInputData;
