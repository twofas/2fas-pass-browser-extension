// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Retrieves the popup state object for a specific tab.
* @param {string} tabId - The ID of the tab for which to retrieve the popup state object.
* @return {Promise<void>} A promise that resolves when the popup state object has been retrieved.
*/
const getPopupStateObjectForTab = async () => { // tabId
  // const popupState = await storage.getItem('session:popupState');
  // return popupState?.[tabId] || null;
};

export default getPopupStateObjectForTab;
