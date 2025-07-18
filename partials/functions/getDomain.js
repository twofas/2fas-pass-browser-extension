// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from '@/partials/URIMatcher';

/** 
* Gets the domain from a URL.
* @param {string} url - The URL to extract the domain from.
* @return {string} The domain of the URL or the original URL if it cannot be parsed.
*/
const getDomain = url => {
  if (!url || !URIMatcher.isText(url) || url.length <= 3 || !URIMatcher.isUrl(url)) {
    throw new Error('Invalid URL provided');
  }

  let urlObj;
  let normalizedURL = '';

  try {
    normalizedURL = URIMatcher.normalizeUrl(url);
    urlObj = new URL(normalizedURL);
    return urlObj?.hostname || url;
  } catch {
    throw new Error('Invalid URL provided');
  }
};

export default getDomain;
