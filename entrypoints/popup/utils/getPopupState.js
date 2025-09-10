// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLastActiveTab from '@/partials/functions/getLastActiveTab.js';

/** 
* Function to get popup state from storage based on the active tab.
* @return {Promise<Object|null>} The popup state object or null if not found.
*/
export const getPopupState = async () => {
  try {
    const extURL = browser.runtime.getURL('/popup.html');
    const isPopupTab = tab => tab.url === extURL;
    
    const targetTab = await getLastActiveTab(
      null,
      tab => !isPopupTab(tab)
    );

    console.log('Target tab for popup state retrieval:', targetTab);
    
    if (!targetTab || !targetTab.id) {
      return null;
    }
    
    const allPopupStates = await storage.getItem('session:popupState');
    const tabPopupState = allPopupStates?.[targetTab.id];
    
    return tabPopupState || null;
  } catch (error) {
    CatchError(error);
    return null;
  }
};