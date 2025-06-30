// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Sorts an array of objects by the "name" property.
* @param {Array} data - The array of objects to sort.
* @param {boolean} [sort=false] - If true, sort in descending order. If false, sort in ascending order.
* @return {Array} The sorted array.
*/
const sortByName = (data, sort = false) => {
  return data.sort((a, b) => {
    if (sort) {
      return a?.name?.toLowerCase() < b?.name?.toLowerCase() ? 1 : -1;
    } else {
      return a?.name?.toLowerCase() > b?.name?.toLowerCase() ? 1 : -1;
    }
  });
};

export default sortByName;
