// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';
import getItems from '@/partials/sessionStorage/getItems';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import saveItems from '@/partials/WebSocket/utils/saveItems';

/** 
* Handles the deletion of an item.
* @param {Object} state - The state object.
* @param {string} messageId - The ID of the message to be sent.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const deleteDataAccept = async (state, messageId) => {
  try {
    const [items, itemsKeys] = await Promise.all([
      getItems(),
      getItemsKeys(state.data.vaultId, state.data.deviceId)
    ]);

    // Clear alarm if exists
    const item = items.find(item => item.id === state.data.itemId);

    if (item && item.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await browser.alarms.clear(`sifT2Reset-${state.data.itemId}||${state.data.deviceId}`);
    }

    // Remove data from items
    const itemsFiltered = items.filter(item => item.id !== state.data.itemId);

    // Remove items from session storage (by itemsKeys)
    await storage.removeItems(itemsKeys);

    // saveItems
    await saveItems(itemsFiltered, state.data.vaultId, state.data.deviceId);

    // Send response
    await sendPullRequestCompleted(messageId);

    return {
      returnUrl: '/',
      returnToast: {
        text: browser.i18n.getMessage('fetch_delete_login_accept_toast'),
        type: 'success'
      }
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionDeleteAcceptError, { event: e });
  }
};

export default deleteDataAccept;
