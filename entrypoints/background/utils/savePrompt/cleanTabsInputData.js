// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to clean up tabs input data.
* @param {Object} details - Details object containing information about the tab.
* @param {Object} inputData - Input data object containing various inputs from the tab.
* @return {Object} An object containing the cleaned up input data.
*/
const cleanTabsInputData = (details, inputData) => {
  let inputsObj = {};

  // Check if inputData is an object and has keys
  if (typeof inputData !== 'object' || !inputData) {
    return {};
  }

  let objKeys = Object.keys(inputData);
  
  if (objKeys.length <= 0) {
    return {};
  }

  // Filter tabsInputData by url origin
  if ((details?.initiator && details?.initiator.length > 0) || (details?.url && details?.url.length > 0)) {
    let origin, testUrl;

    if (details?.initiator && details?.initiator.length > 0) {
      testUrl = details.initiator;
    } else if (details?.url && details?.url.length > 0) {
      testUrl = details.url;
    }

    try {
      origin = new URL(testUrl)?.origin;
    } catch {}

    if (origin) {
      // Filter inputData by url origin
      const filteredData = objKeys.filter(key => inputData[key]?.url === origin);

      inputsObj = filteredData.reduce((acc, key) => {
        acc[key] = inputData[key];
        return acc;
      }, {});
    }
  }

  objKeys = Object.keys(inputsObj);

  if (objKeys.length <= 0) {
    return inputsObj;
  }

  // Filter inputData by timestamp (only latest one from password and username)
  const passwordInputs = objKeys.filter(key => inputsObj[key]?.type === 'password');
  const usernameInputs = objKeys.filter(key => inputsObj[key]?.type === 'username');

  // get latest password input
  const latestPasswordInput = passwordInputs.reduce((latest, key) => {
    if (!latest || inputsObj[key].timestamp > inputsObj[latest].timestamp) {
      return key;
    }
    return latest;
  }, null);

  // get latest username input
  const latestUsernameInput = usernameInputs.reduce((latest, key) => {
    if (!latest || inputsObj[key].timestamp > inputsObj[latest].timestamp) {
      return key;
    }
    return latest;
  }, null);

  // remove all other password inputs
  passwordInputs.forEach(key => {
    if (key !== latestPasswordInput) {
      delete inputsObj[key];
    }
  });

  // remove all other username inputs
  usernameInputs.forEach(key => {
    if (key !== latestUsernameInput) {
      delete inputsObj[key];
    }
  });

  return inputsObj;
};

export default cleanTabsInputData;
