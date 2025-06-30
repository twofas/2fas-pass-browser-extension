// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Creates an image element with the specified source and alt text.
* @param {string} src - The source URL of the image.
* @param {string} alt - The alt text of the image.
* @return {HTMLImageElement} The created image element.
*/

const createImageElement = (src, alt) => {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;

  return img;
};

export default createImageElement;
