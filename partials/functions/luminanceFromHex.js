// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import hexToRgb from './hexToRgb';
import calculateLuminance from './calculateLuminance';

/** 
* Converts a hex color string to its luminance value.
* @param {string} hex - The hex color string.
* @return {number} The luminance value.
*/
const luminanceFromHex = hex => {
  const [r, g, b] = hexToRgb(hex);
  return calculateLuminance(r, g, b);
};

export default luminanceFromHex;
