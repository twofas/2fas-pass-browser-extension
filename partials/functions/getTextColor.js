// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import luminanceFromHex from './luminanceFromHex';
import { HEX_REGEX } from '@/constants';

/** 
* Gets the text color based on the label color.
* @param {string} labelColor - The label color in hex format.
* @return {string} The text color (black or white) based on the label color.
*/
const getTextColor = labelColor => {
  if (labelColor && HEX_REGEX.test(labelColor)) {
    const yiq = luminanceFromHex(labelColor);
    return yiq > 0.5 ? '#000' : '#fff';
  } else {
    return '#fff';
  }
};

export default getTextColor;
