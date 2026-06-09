// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Pure policy deciding whether content-script injection is verified for a single
* polling iteration of injectCSIfNotAlready.
*
* Previously injection was only considered verified when EVERY injectable
* (http/https) frame answered CONTENT_SCRIPT_CHECK. Tracker-heavy pages (bank
* logins, finance portals, etc.) embed sandboxed or transient third-party iframes
* (ad & analytics beacons such as doubleclick/adsrvr) that never run our content
* script, so the count of "ok" responses could never reach the total frame count.
* That made injectCSIfNotAlready report failure, and sendAutofillToTab aborts
* autofill entirely when it does — e.g. login.vanguard.com stopped autofilling.
*
* Policy:
*   1. Verified when every frame currently present answered (okCount >= frameCount).
*   2. Otherwise verified when the top frame is confirmed alive and the responder
*      count has stabilised across several passes. Uncooperative sub-frames will
*      never answer and must not block autofill — AUTOFILL is dispatched to every
*      frame regardless, and cross-domain frames are still gated separately by the
*      allowed-domains list, so accepting a ready top frame is safe.
*
* @param {Object} params - Decision inputs.
* @param {number} params.okCount - Frames that answered CONTENT_SCRIPT_CHECK this pass.
* @param {number} params.frameCount - Injectable frames currently present in the tab.
* @param {boolean} params.topFrameReady - Whether the top frame answered CONTENT_SCRIPT_CHECK.
* @param {number} params.stableIterations - Consecutive passes with an unchanged okCount.
* @param {number} [params.stableThreshold=4] - Passes required before trusting the top frame.
* @return {boolean} True if injection should be treated as verified.
*/
const isInjectionVerified = ({ okCount, frameCount, topFrameReady, stableIterations, stableThreshold = 4 } = {}) => {
  if (typeof okCount !== 'number' || typeof frameCount !== 'number') {
    return false;
  }

  if (frameCount > 0 && okCount >= frameCount) {
    return true;
  }

  if (topFrameReady === true && okCount > 0 && stableIterations >= stableThreshold) {
    return true;
  }

  return false;
};

export default isInjectionVerified;
