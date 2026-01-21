// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get the name of the operating system based on the user agent.
* @return {string} The name of the operating system.
*/
const getOSName = () => {
  let osName = getMessage('unknownOS');

  if (navigator.userAgentData) {
    osName = navigator.userAgentData.platform;
  } else {
    if (navigator.userAgent.indexOf('Windows') !== -1) {
      osName = 'Windows';
    }

    if (navigator.userAgent.indexOf('Mac') !== -1) {
      osName = 'macOS';
    }

    if (navigator.userAgent.indexOf('X11') !== -1) {
      osName = 'UNIX';
    }

    if (navigator.userAgent.indexOf('Linux') !== -1) {
      osName = 'Linux';
    }
  }

  return osName;
};

export default getOSName;
