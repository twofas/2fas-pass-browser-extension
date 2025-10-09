// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from './getItems';

/**
 * Gets a single item from session storage by ID.
 * @async
 * @param {string} id - The ID of the item to retrieve
 * @return {Object|undefined} The item if found, undefined otherwise
 */
const getItem = async id => {
  if (!id) {
    return undefined;
  }

  let items = null;

  try {
    items = await getItems();

    if (!Array.isArray(items)) {
      items = null;
      return undefined;
    }

    const foundItem = items.find(item => item?.id === id);

    items = null;

    return foundItem;
  } catch (e) {
    await CatchError(e);
    items = null;
    return undefined;
  }
};

export default getItem;
