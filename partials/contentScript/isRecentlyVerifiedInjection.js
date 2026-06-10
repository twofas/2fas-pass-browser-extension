// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Time window (ms) during which a tab's previously verified content-script
* injection is trusted without repeating the full verification loop.
*
* A single autofill pass calls injectCSIfNotAlready up to three times (entry,
* resolveCrossDomainPermissions + its retry, and the pre-AUTOFILL re-check). The
* first call performs the full getAllFrames + polling verification; the rest fall
* inside this window and only need a single quick top-frame liveness check. The
* window is intentionally short so a stale entry (e.g. after a navigation) expires
* quickly and falls back to full verification.
* @type {number}
*/
export const VERIFIED_INJECTION_TTL = 5000;

/**
* Pure policy deciding whether a tab's content-script injection was verified
* recently enough to take the fast path (a single top-frame CONTENT_SCRIPT_CHECK)
* instead of the full re-injection + polling loop in injectCSIfNotAlready.
*
* The fast path is eligible only when a verification succeeded within the trust
* window. A missing timestamp (never verified), a non-positive timestamp, a future
* timestamp (clock skew) or an elapsed time beyond the window all fall through to
* the full verification path.
* @param {Object} params - Decision inputs.
* @param {number} [params.verifiedAt] - Timestamp (ms) of the last verified injection, or undefined if none.
* @param {number} params.now - Current timestamp (ms).
* @param {number} [params.ttl=VERIFIED_INJECTION_TTL] - Trust window in ms.
* @return {boolean} True if the fast path is eligible.
*/
const isRecentlyVerifiedInjection = ({ verifiedAt, now, ttl = VERIFIED_INJECTION_TTL } = {}) => {
  if (typeof verifiedAt !== 'number' || typeof now !== 'number') {
    return false;
  }

  if (verifiedAt <= 0) {
    return false;
  }

  const elapsed = now - verifiedAt;

  return elapsed >= 0 && elapsed < ttl;
};

export default isRecentlyVerifiedInjection;
