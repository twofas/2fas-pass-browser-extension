// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to check if the items are correct.
* @param {Array} items - The array of items.
* @return {boolean} True if the items are correct, false otherwise.
*/
const isItemsCorrect = items => {
  if (!items || !Array.isArray(items) || items?.length <= 0) {
    return false;
  }

  return true;
};

export default isItemsCorrect;
