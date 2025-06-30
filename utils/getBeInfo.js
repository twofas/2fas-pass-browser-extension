// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* This function is used to get the browser extension information.
* @async
* @return {Object} An object containing the browser extension information.
*/
export const getBeInfo = async () => {
  try {
    const manifest = browser.runtime.getManifest();
    const browserInfo = await storage.getItem('local:browserInfo');
  
    return {
      scheme: config.scheme,
      origin: `browserExt-${browserInfo?.browserName?.toLowerCase()}`,
      originVersion: manifest.version,
      browserName: browserInfo.browserName,
      browserVersion: browserInfo.browserVersion,
      browserExtName: browserInfo.name
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.getBeInfo, { event: e });
  }
};
