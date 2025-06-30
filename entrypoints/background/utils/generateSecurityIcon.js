// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import secIconColors from '@/constants/secIconColors';
import secIconSVGs from '@/constants/secIconSVGs';

/** 
* Function to generate a security icon based on a Base64 encoded key.
* @async
* @param {string} keyB64 - The Base64 encoded key.
* @return {Promise<void>} A promise that resolves when the icon is generated.
*/
const generateSecurityIcon = async keyB64 => {
  let svgColors = structuredClone(secIconColors);

  const keyAB = Base64ToArrayBuffer(keyB64);
  const digestSHA256AB = await crypto.subtle.digest('SHA-256', keyAB);
  const keyHex = ArrayBufferToHex(digestSHA256AB);

  const iconHex = keyHex.substring(0, 2);
  const iconDecimal = parseInt(iconHex, 16);
  const iconModulo = iconDecimal % secIconSVGs.length;
  const icon = secIconSVGs[iconModulo];

  const colors = [];

  for (let i = 1; i < 4; i++) {
    const colorHex = keyHex.substring(i * 2, (i * 2) + 2);
    const colorDecimal = parseInt(colorHex, 16);
    const colorModulo = colorDecimal % svgColors.length;

    colors.push(svgColors[colorModulo]);
    svgColors.splice(colorModulo, 1);
  }

  await storage.setItem('local:securityIcon', { icon, colors });
};

export default generateSecurityIcon;
