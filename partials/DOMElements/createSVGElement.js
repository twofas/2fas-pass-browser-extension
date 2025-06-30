// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Create SVG element from string.
* @param {string} data - SVG string.
* @return {Element} The created SVG element.
*/

const createSVGElement = data => {
  const svg = document.createElement('svg');
  svg.innerHTML = data.trim();

  return svg.firstChild;
};

export default createSVGElement;
