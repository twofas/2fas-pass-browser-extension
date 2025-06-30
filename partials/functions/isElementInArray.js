// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Checks if an element is in an array.
* @param {Node} element - The element to check.
* @param {Array<Node>} array - The array to check against.
* @return {boolean} True if the element is in the array, false otherwise.
*/
const isElementInArray = (element, array) => {
  let elementInArray = false;

  if (!element || !array || array.length <= 0) {
    return elementInArray;
  }

  array.forEach(item => {
    // FUTURE - Add check if elements, if exists etc.
    if (element.isEqualNode(item)) {
      elementInArray = true;
    }
  });

  return elementInArray;
};

export default isElementInArray;
