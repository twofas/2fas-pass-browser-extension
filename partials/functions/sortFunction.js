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
    const nameA = a?.content?.name?.toLowerCase();
    const nameB = b?.content?.name?.toLowerCase();

    switch (sort) {
      case 'za':
        if (nameA !== nameB) {
          return nameA < nameB ? 1 : -1;
        }

        return new Date(b?.createdAt) - new Date(a?.createdAt);
      case 'newest':
        return new Date(b?.createdAt) - new Date(a?.createdAt);
      case 'oldest':
        return new Date(a?.createdAt) - new Date(b?.createdAt);
      case 'az':
      default:
        if (nameA !== nameB) {
          return nameA > nameB ? 1 : -1;
        }

        return new Date(a?.createdAt) - new Date(b?.createdAt);
    }
  });
};

export default sortFunction;
