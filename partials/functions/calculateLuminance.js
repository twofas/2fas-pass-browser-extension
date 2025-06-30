// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Calculates the relative luminance of a color.
* @param {number} r - The red component (0-255).
* @param {number} g - The green component (0-255).
* @param {number} b - The blue component (0-255).
* @return {number} The relative luminance (0-1).
*/
const calculateLuminance = (r, g, b) => {
  const [R, G, B] = [r, g, b].map(value => {
    value /= 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

export default calculateLuminance;
