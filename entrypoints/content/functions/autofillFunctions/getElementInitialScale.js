// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get the initial scale of an element.
* @param {HTMLElement} element - The element to get the initial scale for.
* @return {Number} The initial scale of the element.
*/
const getElementInitialScale = element => {
  return Math.round(element.getBoundingClientRect().width / element.offsetWidth * 100) / 100;
};

export default getElementInitialScale;
