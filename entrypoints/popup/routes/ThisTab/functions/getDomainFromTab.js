// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLastActiveTab from '@/partials/functions/getLastActiveTab';
import correctProtocols from '@/constants/correctProtocols';

/** 
* Function to get the domain from the active tab.
* @async
* @return {Object} The domain and URL of the active tab.
*/
const getDomainFromTab = async () => {
  let url;

  const onCatch = () => {
    return {
      domain: browser.i18n.getMessage('unknown'),
      url: browser.i18n.getMessage('unknown')
    };
  };

  const tab = await getLastActiveTab(onCatch);

  if (!tab) {
    return {
      domain: browser.i18n.getMessage('unknown'),
      url: browser.i18n.getMessage('unknown')
    };
  }

  try {
    url = new URL(tab?.url);
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

export default getDomainFromTab;
