// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Sorts an array of items based on the provided sort criteria.
* @param {Array} data - The array of items to sort.
* @param {string} sort - The sorting criteria: 'az' (A-Z, default), 'za' (Z-A), 'newest', or 'oldest'.
* @return {Array} The sorted array.
*/
const sortFunction = (data, sort = 'az') => {
  return data.sort((a, b) => {
    switch (sort) {
      case 'za':
        return a?.content?.name?.toLowerCase() < b?.content?.name?.toLowerCase() ? 1 : -1;
      case 'newest':
        return new Date(b?.updatedAt) - new Date(a?.updatedAt);
      case 'oldest':
        return new Date(a?.updatedAt) - new Date(b?.updatedAt);
      case 'az':
      default:
        return a?.content?.name?.toLowerCase() > b?.content?.name?.toLowerCase() ? 1 : -1;
    }
  });
};

export default sortFunction;
