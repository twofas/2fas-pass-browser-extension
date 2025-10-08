// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';
import getItems from '@/partials/sessionStorage/getItems';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import compressObject from '@/partials/gzip/compressObject';
import saveItems from '@/partials/WebSocket/utils/saveItems';

/** 
* Handles the update of a item that has been added in T1.
* @param {Object} state - The state object.
* @param {string} messageId - The message ID.
* @return {Promise<Object>}  Object containing returnUrl and returnToast.
*/
const updateDataAddedInT1 = async (state, messageId) => {
  try {
    const [items, itemsKeys] = await Promise.all([
      getItems(),
      getItemsKeys(state.data.deviceId)
    ]);

    // Clear alarm if exists
    const item = items.find(item => item.id === state.data.itemId);

    if (item && item.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await browser.alarms.clear(`passwordT2Reset-${state.data.itemId}`);
    }

    // Remove item from items
    const itemsFiltered = items.filter(item => item.id !== state.data.itemId);

    // Compress items
    const itemsGZIP = await compressObject(itemsFiltered);

    // Remove items from session storage (by itemsKeys)
    await storage.removeItems(itemsKeys);

    // saveItems
    await saveItems(itemsGZIP, state.data.deviceId);

    // Send response
    await sendPullRequestCompleted(messageId);

    return {
      returnUrl: '/',
      returnToast: {
        text: browser.i18n.getMessage('fetch_update_login_added_in_t1_toast'),
        type: 'success'
      }
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginAddedInT1Error, { event: e });
  }
};

export default updateDataAddedInT1;
