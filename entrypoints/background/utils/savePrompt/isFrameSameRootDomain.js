// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { getRootDomain } from './checkDomainOnIgnoredList';

/**
* Extracts the hostname from a URL string.
* @param {string} url - The URL to parse.
* @return {string} The hostname, or '' when the URL is missing or unparsable.
*/
const hostnameFromUrl = url => {
  if (typeof url !== 'string' || url.length <= 0) {
    return '';
  }

  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

/**
* Decides whether a sub-frame shares the active tab's root domain — the scope the
* save-prompt pipeline is allowed to capture and propose credentials for.
*
* Root-domain (not exact-origin) matching is used on purpose so that a login form
* embedded in a same-site iframe (e.g. login.example.com inside www.example.com)
* is treated as belonging to the page, mirroring the autofill cross-domain model
* and the actionDomain===tabDomain gate in onTabUpdated. Cross-root-domain iframes
* (e.g. an accounts.google.com SSO widget on example.com) are not same-site and
* return false, so their credentials are never captured for the embedding page.
*
* about:blank / about:srcdoc frames expose no hostname of their own and return
* false here, so they are treated as ineligible (fail-closed) — consistent across
* the sender (isSavePromptSenderEligible) and webRequest (isProcessableWebRequestFrame)
* gates, since such frames tag captured inputs with an opaque origin that can never
* be matched to their submitting request downstream.
* @param {string} frameUrl - The sub-frame's effective URL (initiator/originUrl/documentUrl).
* @param {string} tabUrl - The active tab's top-frame URL.
* @return {boolean} True when both resolve to the same root domain.
*/
const isFrameSameRootDomain = (frameUrl, tabUrl) => {
  const frameHost = hostnameFromUrl(frameUrl);
  const tabHost = hostnameFromUrl(tabUrl);

  if (!frameHost || !tabHost) {
    return false;
  }

  return getRootDomain(frameHost) === getRootDomain(tabHost);
};

export default isFrameSameRootDomain;
export { hostnameFromUrl };
