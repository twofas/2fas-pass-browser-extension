// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import updateNoAccountItem from '../contextMenu/updateNoAccountItem';
import getLastActiveTab from '@/partials/functions/getLastActiveTab';

/** 
* Function to update the context menu based on the last active tab.
* @async
* @param {Array} services - Optional array of services to update the context menu with.
* @return {Promise<void>} A promise that resolves when the context menu is updated.
*/
const updateContextMenu = async (services = null) => {
  const tab = await getLastActiveTab(() => null);

  if (tab && tab?.id) {
    await updateNoAccountItem(tab.id, services);
  }
};

export default updateContextMenu;
