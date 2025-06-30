// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Checks if a DOM element is visible.
* @param {HTMLElement} domElement - The DOM element to check.
* @return {boolean} True if the element is visible, false otherwise.
*/
const isVisible = domElement => {
  return domElement.checkVisibility({
    contentVisibilityAuto: true,
    opacityProperty: false,
    visibilityProperty: true
  });
};

export default isVisible;
