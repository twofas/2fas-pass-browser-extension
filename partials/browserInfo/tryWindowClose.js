// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getBrowserInfo from './getBrowserInfo';

/** 
* Function to attempt closing the current browser window.
* @return {boolean} Returns always false. If the window close attempt is made, it will not be possible to confirm success.
*/
const tryWindowClose = () => {
  if (
    !window ||
    typeof window?.close !== 'function'
  ) {
    return false;
  }

  if (import.meta.env.BROWSER === 'safari') {
    const browserInfo = getBrowserInfo();

    if (browserInfo.browserVersion) {
      const majorVersion = parseInt(browserInfo.browserVersion.split('.')[0], 10);

      if (majorVersion >= 26) {
        try {
          window.close();
          return false;
        } catch {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    try {
      window.close();
      return false;
    } catch {
      return false;
    }
  }
};

export default tryWindowClose;
