// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to retrieve all tab IDs in the browser.
* @return {Promise<Array<number>>} A promise that resolves to an array of tab IDs.
*/
const getAllTabsIds = async () => {
  const tabs = await browser.tabs.query({});
  return tabs.map(tab => tab.id);
};

export default getAllTabsIds;
