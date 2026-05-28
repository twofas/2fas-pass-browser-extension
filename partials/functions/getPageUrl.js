// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from '@/partials/URIMatcher';

/**
* Resolves the URL representing the page that initiated a webRequest.
* Cross-browser ordering: Chromium exposes `initiator` (origin only), Firefox
* exposes `originUrl` and `documentUrl`. The tab's own URL is the next
* fallback; the request URL itself is used only as a last resort, because it
* can point to a cross-domain auth backend rather than the user-facing page.
* @param {Object} details - WebRequest details object.
* @param {string} [tabUrl] - Optional tab URL fallback (from browser.tabs.get).
* @return {string|undefined} The best page URL, or undefined when none is usable.
*/
const getPageUrl = (details, tabUrl) => {
  const candidates = [
    details?.initiator,
    details?.originUrl,
    details?.documentUrl,
    tabUrl
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') {
      continue;
    }

    let isValid = false;

    try {
      isValid = URIMatcher.isUrl(candidate, true);
    } catch {
      isValid = false;
    }

    if (isValid) {
      return candidate;
    }
  }

  return details?.url;
};

export default getPageUrl;
