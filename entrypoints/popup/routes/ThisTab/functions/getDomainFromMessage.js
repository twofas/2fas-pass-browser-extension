// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import correctProtocols from '@/constants/correctProtocols';

/** 
* Function to get the domain from a message.
* @param {Object} message - The message object containing the URL.
* @return {Object} The domain and URL of the message.
*/
const getDomainFromMessage = message => {
  let url;

  try {
    url = new URL(message?.url);
  } catch {
    return {
      domain: browser.i18n.getMessage('unknown'),
      url: browser.i18n.getMessage('unknown')
    };
  }

  if (!correctProtocols.includes(url.protocol)) {
    return {
      domain: browser.i18n.getMessage('browser_internal_page'),
      url: url.href
    };
  }

  return {
    domain: url.hostname,
    url: url.href
  };
};

export default getDomainFromMessage;
