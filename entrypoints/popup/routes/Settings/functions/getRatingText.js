// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get the rating text based on the browser type.
* @return {string} The rating text for the current browser.
*/
const getRatingText = () => {
  switch (import.meta.env.BROWSER) {
    case 'chrome':
    case 'opera': {
      return getMessage('settings_rate_us_chrome');
    }

    case 'firefox': {
      return getMessage('settings_rate_us_firefox');
    }

    case 'edge': {
      return getMessage('settings_rate_us_edge');
    }

    case 'safari': {
      return getMessage('settings_rate_us_safari');
    }

    default: {
      return getMessage('settings_rate_us_chrome');
    }
  }
};

export default getRatingText;
