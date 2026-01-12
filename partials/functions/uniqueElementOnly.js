// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Returns only unique elements from an array based on element identity (not structure).
* @param {HTMLElement} value - The element to be checked.
* @param {number} index - The index of the element.
* @param {HTMLElement[]} self - The array to be checked.
* @return {boolean} True if this is the first occurrence of the element.
*/
const uniqueElementOnly = (value, index, self) => {
  return self.indexOf(value) === index;
};

export default uniqueElementOnly;
