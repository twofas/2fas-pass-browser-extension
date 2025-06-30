// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get the rating link based on the browser type.
* @return {string} The rating link for the current browser.
*/
const getRatingLink = () => {
  switch (import.meta.env.BROWSER) {
    case 'chrome':
    case 'opera': {
      return 'https://chromewebstore.google.com/detail/ehboaofjncodknjkngdggmpdinhdoijp';
    }

    case 'firefox': {
      return 'https://addons.mozilla.org/pl/firefox/addon/2fas-pass-browser-extension/';
    }

    case 'edge': {
      return 'https://microsoftedge.microsoft.com/addons/detail/hnhnaihhclglkfgcgggcmamjhmdjhbma';
    }

    case 'safari': {
      return 'https://apps.apple.com/us/app/2fas-pass-browser-extension/id6745695807';
    }

    default: {
      return 'https://chromewebstore.google.com/detail/ehboaofjncodknjkngdggmpdinhdoijp';
    }
  }
};

export default getRatingLink;
