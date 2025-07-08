// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';
import getServices from '@/partials/sessionStorage/getServices';
import getServicesKeys from '@/partials/sessionStorage/getServicesKeys';
import compress from '@/partials/gzip/compress';
import saveServices from '@/partials/WebSocket/utils/saveServices';

/** 
* Handles the deletion of a login in T2 or T3.
* @param {Object} state - The state object.
* @param {string} messageId - The ID of the message to be sent.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const deleteLoginAccept = async (state, messageId) => {
  try {
    // Get services
    const services = await getServices();

    // Get servicesKeys
    const servicesKeys = await getServicesKeys(state.data.deviceId);

    // Clear alarm if exists
    const service = services.find(service => service.id === state.data.loginId);

    if (service && service.securityType === SECURITY_TIER.HIGHLY_SECRET) {
      await browser.alarms.clear(`passwordT2Reset-${state.data.loginId}`);
    }

    // Remove login from services
    const servicesFiltered = services.filter(service => service.id !== state.data.loginId);

    // Compress services
    const servicesStringify = JSON.stringify(servicesFiltered);
    const servicesGZIP_AB = await compress(servicesStringify);
    const servicesGZIP = ArrayBufferToBase64(servicesGZIP_AB);

    // Remove services from session storage (by servicesKeys)
    await storage.removeItems(servicesKeys);

    // saveServices
    await saveServices(servicesGZIP, state.data.deviceId);

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
    throw new TwoFasError(TwoFasError.errors.pullRequestActionDeleteAcceptError);
  }
};

export default deleteLoginAccept;
