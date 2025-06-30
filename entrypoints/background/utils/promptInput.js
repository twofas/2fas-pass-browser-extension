// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to save input data for a prompt in a specific tab.
* @async
* @param {Object} request - The request object containing the input data.
* @param {Object} sender - The sender object containing information about the tab.
* @param {Object} tabsInputData - The object storing input data for each tab.
* @return {Promise<void>} A promise that resolves when the input is processed.
*/
const promptInput = async (request, sender, tabsInputData) => {
  if (!tabsInputData[sender.tab.id]) {
    tabsInputData[sender.tab.id] = {};
  }
  
  tabsInputData[sender.tab.id][request.data.id] = request.data;
};

export default promptInput;
