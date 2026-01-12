// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to get the initial scale of an element.
* @param {HTMLElement} element - The element to get the initial scale for.
* @return {number} The initial scale of the element, defaults to 1 if calculation fails.
*/
const getElementInitialScale = element => {
  const offsetWidth = element.offsetWidth;

  if (offsetWidth === 0) {
    return 1;
  }

  return Math.round(element.getBoundingClientRect().width / offsetWidth * 100) / 100;
};

export default getElementInitialScale;
