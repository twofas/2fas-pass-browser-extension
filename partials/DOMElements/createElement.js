// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Creates an element with the specified tag name and class name.
* @param {string} tagName - The tag name of the element to be created.
* @param {string} [className=null] - The class name of the element (optional).
* @return {HTMLElement} The created element.
*/

const createElement = (tagName, className = null) => {
  const el = document.createElement(tagName);

  if (className) {
    el.className = className;
  }

  return el;
};

export default createElement;
