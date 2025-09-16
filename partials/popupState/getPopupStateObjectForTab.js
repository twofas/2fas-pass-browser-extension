// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import getCurrentDevice from '@/partials/functions/getCurrentDevice';

/**
* Retrieves the popup state object for a specific tab.
* @param {string} tabId - The ID of the tab for which to retrieve the popup state object.
* @return {Promise<Object|null>} The popup state object or null if not found.
*/
const getPopupStateObjectForTab = async tabId => {
  try {
    const device = await getCurrentDevice();

    if (!device?.uuid) {
      return null;
    }

    const storageKey = await getKey('popup_state', { uuid: device.uuid });

    if (!storageKey) {
      return null;
    }

    const popupState = await storage.getItem(`session:${storageKey}`);

    return popupState?.[tabId] || null;
  } catch (error) {
    CatchError(error);
    return null;
  }
};

export default getPopupStateObjectForTab;
