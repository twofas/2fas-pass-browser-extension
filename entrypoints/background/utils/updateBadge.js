// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import setBadge from './setBadge';
import getLastActiveTab from '@/partials/functions/getLastActiveTab';

/** 
* Function to update the browser badge based on the last active tab's URL.
* @async
* @param {Array} services - Optional array of services to use for badge updates.
* @return {Promise<void>} A promise that resolves when the badge is updated.
*/
const updateBadge = async (services = null) => {
  const tab = await getLastActiveTab(() => null);

  if (!tab) {
    return false;
  }

  await setBadge(tab?.url, tab?.id, services);
};

export default updateBadge;
