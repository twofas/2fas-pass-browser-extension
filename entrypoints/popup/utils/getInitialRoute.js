// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLastActiveTab from '@/partials/functions/getLastActiveTab';

/**
 * Get the initial route from popupState
 * @return {Promise<string>} The initial route path
 */
export const getInitialRoute = async () => {
  try {
    const extURL = browser.runtime.getURL('/popup.html');
    const isPopupTab = tab => tab.url === extURL;
    
    const targetTab = await getLastActiveTab(
      null,
      tab => !isPopupTab(tab)
    );

    if (!targetTab || !targetTab.id) {
      return '/';
    }
    
    const allPopupStates = await storage.getItem('session:popupState');
    const tabPopupState = allPopupStates?.[targetTab.id];
    
    return tabPopupState?.href || '/';
  } catch (error) {
    CatchError(error);
    return '/';
  }
};