// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Returns only unique values from an array.
* @param {any} value - The value to be checked.
* @param {number} index - The index of the value.
* @param {Array} self - The array to be checked.
* @return {Array} An array with only unique values.
*/
const uniqueOnly = (value, index, self) => {
  return self.indexOf(value) === index;
};

export default uniqueOnly;
