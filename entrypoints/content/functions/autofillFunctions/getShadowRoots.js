// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Traverses the DOM tree and returns all shadow roots found.
* Uses an iterative stack-based pre-order traversal: every element is visited
* exactly once and a shadow host's shadow content is processed before its light
* children, mirroring the original recursive ordering without per-node array
* allocations or a visited set.
* @param {HTMLElement|null} rootElement - The element to start traversing from, or null for entire document.
* @return {ShadowRoot[]} An array of shadow roots found in the DOM tree.
*/
const getShadowRoots = rootElement => {
  const shadowRoots = [];
  const startElement = rootElement || document.body;

  if (!startElement) {
    return shadowRoots;
  }

  const stack = [startElement];

  while (stack.length > 0) {
    const element = stack.pop();
    const shadowRoot = element.shadowRoot;

    if (shadowRoot) {
      shadowRoots.push(shadowRoot);
    }

    const lightChildren = element.children;

    if (lightChildren) {
      for (let i = lightChildren.length - 1; i >= 0; i--) {
        stack.push(lightChildren[i]);
      }
    }

    if (shadowRoot && shadowRoot.children) {
      const shadowChildren = shadowRoot.children;

      for (let i = shadowChildren.length - 1; i >= 0; i--) {
        stack.push(shadowChildren[i]);
      }
    }
  }

  return shadowRoots;
};

export default getShadowRoots;
