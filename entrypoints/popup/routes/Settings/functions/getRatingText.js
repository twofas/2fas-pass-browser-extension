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
      return browser.i18n.getMessage('settings_rate_us_chrome');
    }

    case 'firefox': {
      return browser.i18n.getMessage('settings_rate_us_firefox');
    }

    case 'edge': {
      return browser.i18n.getMessage('settings_rate_us_edge');
    }

    case 'safari': {
      return browser.i18n.getMessage('settings_rate_us_safari');
    }

    default: {
      return browser.i18n.getMessage('settings_rate_us_chrome');
    }
  }
};

export default getRatingText;
