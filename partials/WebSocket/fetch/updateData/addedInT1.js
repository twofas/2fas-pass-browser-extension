// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';
import getServices from '@/partials/sessionStorage/getServices';
import getItemsKeys from '@/partials/sessionStorage/getItemsKeys';
import compress from '@/partials/gzip/compress';
import saveServices from '@/partials/WebSocket/utils/saveServices';

/** 
* Handles the update of a item that has been added in T1.
* @param {Object} state - The state object.
* @param {string} messageId - The message ID.
* @return {Promise<Object>}  Object containing returnUrl and returnToast.
*/
const updateDataAddedInT1 = async (state, messageId) => {
  try {
    const [services, itemsKeys] = await Promise.all([
      getServices(),
      getItemsKeys(state.data.deviceId)
    ]);

    // Clear alarm if exists
    const service = services.find(service => service.id === state.data.itemId);

    if (service && service.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await browser.alarms.clear(`passwordT2Reset-${state.data.itemId}`);
    }

    // Remove item from services
    const servicesFiltered = services.filter(service => service.id !== state.data.itemId);

    // Compress services
    const servicesStringify = JSON.stringify(servicesFiltered);
    const servicesGZIP_AB = await compress(servicesStringify);
    const servicesGZIP = ArrayBufferToBase64(servicesGZIP_AB);

    // Remove items from session storage (by itemsKeys)
    await storage.removeItems(itemsKeys);

    // saveServices
    await saveServices(servicesGZIP, state.data.deviceId);

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
