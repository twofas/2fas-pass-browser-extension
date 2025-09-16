// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import getCurrentDevice from '@/partials/functions/getCurrentDevice';

/**
* Creates a popup state object for a specific tab.
* @param {string} tabId - The ID of the tab for which to create the popup state object.
* @return {Promise<void>} A promise that resolves when the popup state object has been created.
*/
const createPopupStateObjectForTab = async tabId => {
  try {
    const device = await getCurrentDevice();

    if (!device?.uuid) {
      return;
    }

    const storageKey = await getKey('popup_state', { uuid: device.uuid });

    if (!storageKey) {
      return;
    }

    let popupState = await storage.getItem(`session:${storageKey}`);

    if (!popupState || typeof popupState !== 'object') {
      popupState = {};
    }

    if (!popupState[tabId]) {
      popupState[tabId] = {
        data: {},
        scrollPosition: 0,
        href: ''
      };

      await storage.setItem(`session:${storageKey}`, popupState);
    }
  } catch (error) {
    CatchError(error);
  }
};

export default createPopupStateObjectForTab;
