// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLastActiveTab from '@/partials/functions/getLastActiveTab';
import getKey from '@/partials/sessionStorage/getKey';
import getCurrentDevice from '@/partials/functions/getCurrentDevice';

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

    const device = await getCurrentDevice();

    if (!device?.uuid) {
      return '/';
    }

    const storageKey = await getKey('popup_state', { uuid: device.uuid });

    if (!storageKey) {
      return '/';
    }

    const allPopupStates = await storage.getItem(`session:${storageKey}`);
    const tabPopupState = allPopupStates?.[targetTab.id];

    return tabPopupState?.href || '/';
  } catch (error) {
    CatchError(error);
    return '/';
  }
};