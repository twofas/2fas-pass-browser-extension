// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get all shadow roots of a given element.
* @param {HTMLElement} el - The element to get shadow roots from.
* @return {Array} An array of shadow root elements.
*/
const getShadowRoots = el => {
  let shadowElements = [];

  const getShadowChildren = (element) => {
    if (element.shadowRoot) {
      shadowElements.push(element.shadowRoot);
      const childElements = Array.from(element.shadowRoot.querySelectorAll('*'));
      childElements.forEach((child) => getShadowChildren(child));
    } else {
      shadowElements.push(element);
    }
  };

  const traverseAllElements = (elements) => {
    elements.forEach((el) => {
      if (el.shadowRoot) {
        getShadowChildren(el);
      }

      traverseAllElements(Array.from(el.children));
    });
  };

  const allElements = Array.from(el ? [el] : document.querySelectorAll('*'));
  traverseAllElements(allElements);

  return shadowElements;
};

export default getShadowRoots;