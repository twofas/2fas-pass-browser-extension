// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Gets the loader progress based on the input value.
* @param {number} value - The input value to calculate the loader progress.
* @return {number} The calculated loader progress.
*/
const getLoaderProgress = value => {
  return 264 - 2.64 * value;
};

export default getLoaderProgress;
