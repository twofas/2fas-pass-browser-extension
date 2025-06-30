// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isText from './isText';

/** 
* Converts a string to Unicode Normalization Form KD (NFKD).
* @param {string} value - The string to convert.
* @return {string} The NFKD normalized string.
* @throws {Error} The value is not a text.
* @throws {Error} The value does not support normalization.
*/
const valueToNFKD = value => {
  if (!isText(value)) {
    throw new TwoFasError(TwoFasError.internalErrors.valueToNFKDNotText, { additional: { func: 'valueToNFKD' } });
  }

  if (typeof value.normalize === 'function') {
    return value.normalize('NFKD');
  } else {
    throw new TwoFasError(TwoFasError.internalErrors.valueToNFKDNotSupportNormalization, { additional: { func: 'valueToNFKD' } });
  }
};

export default valueToNFKD;
