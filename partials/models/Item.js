// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { HEX_REGEX } from '@/constants';

/**
* Class representing an item.
*/
class Item {
  constructor (data) {
    validate(data && typeof data === 'object', 'Invalid item data');
  }

  /** 
  * Converts a hex color code to RGB.
  * @param {string} hex - The hex color code.
  * @return {Array<number>} The RGB representation of the color.
  */
  #hexToRgb (hex) {
    hex = hex.replace(/^#/, '');

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return [r, g, b];
  }

  /** 
  * Calculates the relative luminance of a color.
  * @param {number} r - The red component (0-255).
  * @param {number} g - The green component (0-255).
  * @param {number} b - The blue component (0-255).
  * @return {number} The relative luminance (0-1).
  */
  #calculateLuminance (r, g, b) {
    const [R, G, B] = [r, g, b].map(value => {
      value /= 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  /** 
  * Converts a hex color string to its luminance value.
  * @param {string} hex - The hex color string.
  * @return {number} The luminance value.
  */
  #luminanceFromHex (hex) {
    const [r, g, b] = this.#hexToRgb(hex);
    return this.#calculateLuminance(r, g, b);
  }

  /** 
  * Gets the text color based on the item label color.
  * @return {string} The text color (black or white) based on the label color.
  */
  get textColor () {
    if (!this.labelColor) {
      return '#fff';
    }

    if (this.labelColor && HEX_REGEX.test(this.labelColor)) {
      const yiq = this.#luminanceFromHex(this.labelColor);
      return yiq > 0.5 ? '#000' : '#fff';
    } else {
      return '#fff';
    }
  }
}

export default Item;
