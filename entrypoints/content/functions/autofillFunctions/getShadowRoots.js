// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Traverses the DOM tree and returns all shadow roots found.
* @param {HTMLElement|null} rootElement - The element to start traversing from, or null for entire document.
* @return {ShadowRoot[]} An array of shadow roots found in the DOM tree.
*/
const getShadowRoots = rootElement => {
  const shadowRoots = [];
  const visited = new WeakSet();

  const traverseElement = element => {
    if (!element || visited.has(element)) {
      return;
    }

    visited.add(element);

    if (element.shadowRoot) {
      shadowRoots.push(element.shadowRoot);

      Array.from(element.shadowRoot.querySelectorAll('*')).forEach(traverseElement);
    }

    Array.from(element.children || []).forEach(traverseElement);
  };

  const startElement = rootElement || document.body;

  traverseElement(startElement);

  return shadowRoots;
};

export default getShadowRoots;