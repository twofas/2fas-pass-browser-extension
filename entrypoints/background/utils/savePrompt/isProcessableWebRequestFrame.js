// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isFrameSameRootDomain from './isFrameSameRootDomain';

/**
* Whether a webRequest belongs to the top-level document of its tab.
* Chromium exposes `frameType`; Firefox is detected via `parentFrameId === -1`.
* @param {Object} details - WebRequest details object.
* @return {boolean} True for the outermost (top) frame.
*/
const isOutermostFrame = details => {
  if (details?.frameType) {
    return details.frameType === 'outermost_frame';
  }

  return details?.parentFrameId === -1;
};

/**
* Resolves the URL of the document that initiated a webRequest, from the
* frame-specific fields only (Chromium `initiator`, Firefox `originUrl` /
* `documentUrl`). The tab URL is deliberately NOT used as a fallback here — a
* sub-frame request must be matched against the frame's own origin, never the
* page's, or a cross-domain sub-frame would masquerade as same-domain.
* @param {Object} details - WebRequest details object.
* @return {string} The frame's origin URL, or '' when none is reported.
*/
const getFrameOriginUrl = details => details?.initiator || details?.originUrl || details?.documentUrl || '';

/**
* Gate deciding whether the save-prompt pipeline should process a webRequest.
*
* The top document is always processable (the historical behaviour). A sub-frame
* request is processable only when the frame shares the active tab's root domain
* — this is what enables save prompts for login forms embedded in same-site
* iframes while still rejecting cross-domain sub-frames (e.g. SSO widgets), whose
* credentials belong to the embedded site rather than the page.
* @param {Object} details - WebRequest details object.
* @param {string} [tabUrl] - The active tab's top-frame URL.
* @return {boolean} True when the request should be processed.
*/
const isProcessableWebRequestFrame = (details, tabUrl) => {
  if (isOutermostFrame(details)) {
    return true;
  }

  const frameUrl = getFrameOriginUrl(details);

  if (!frameUrl || !tabUrl) {
    return false;
  }

  return isFrameSameRootDomain(frameUrl, tabUrl);
};

export default isProcessableWebRequestFrame;
export { isOutermostFrame, getFrameOriginUrl };
