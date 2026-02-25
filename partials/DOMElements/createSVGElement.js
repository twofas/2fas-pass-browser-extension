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
  const parser = new DOMParser();
  const doc = parser.parseFromString(data.trim(), 'image/svg+xml');

  return doc.documentElement;
};

export default createSVGElement;
