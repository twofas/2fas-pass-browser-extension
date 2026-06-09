// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from './sendMessageToAllFrames.js';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready.js';
import classifyCrossDomainPermissions from './classifyCrossDomainPermissions.js';

/**
* Discovers cross-domain frame hostnames in a tab via webNavigation, independent
* of whether the content scripts in those frames have responded yet. This is the
* authoritative source of truth for which hostnames are actually present in the tab.
* @async
* @param {number} tabId - The tab to inspect.
* @return {Promise<Set<string>>} Set of cross-domain hostnames (excluding the top frame's hostname).
*/
const discoverCrossDomainHostnames = async tabId => {
  let frames = [];

  try {
    frames = await browser.webNavigation.getAllFrames({ tabId });
  } catch {
    return new Set();
  }

  if (!Array.isArray(frames) || frames.length === 0) {
    return new Set();
  }

  const validFrames = frames.filter(f => f?.url && (f.url.startsWith('http://') || f.url.startsWith('https://')));
  const topFrame = validFrames.find(f => f.parentFrameId === -1);

  let topHostname = null;

  if (topFrame?.url) {
    try {
      topHostname = new URL(topFrame.url).hostname;
    } catch {}
  }

  const result = new Set();

  for (const frame of validFrames) {
    if (frame === topFrame) {
      continue;
    }

    try {
      const hostname = new URL(frame.url).hostname;

      if (hostname && hostname !== topHostname) {
        result.add(hostname);
      }
    } catch {}
  }

  return result;
};

/**
* Resolves cross-domain permissions for iframe autofill by classifying
* each cross-domain iframe's hostname as trusted, untrusted, or unknown.
*
* If a cross-domain iframe is present in webNavigation but did not respond to
* CHECK_IFRAME_PERMISSION (content script not ready), this function retries once
* after re-injection. If still no response, the hostname is added to unknownDomains
* so the user is prompted for trust — this prevents the previous "silent allow"
* race where a slow iframe would auto-receive permission via the iframePermissionGranted
* fallback after content script eventually loaded.
* @async
* @param {number} tabId - The ID of the tab to check.
* @param {string} autofillType - The type of autofill ('login' or 'card').
* @param {Object} [dataFields] - Flags indicating which data fields are available for autofill.
* @return {Promise<Object>} Classification result with needsDialog, allAllowed, allBlocked,
*   trustedDomains, untrustedDomains, unknownDomains arrays.
*/
const resolveCrossDomainPermissions = async (tabId, autofillType, dataFields) => {
  const result = {
    needsDialog: false,
    allAllowed: true,
    allBlocked: false,
    trustedDomains: [],
    untrustedDomains: [],
    unknownDomains: [],
    crossDomainAllowedDomains: []
  };

  try {
    await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);
  } catch (e) {
    await CatchError(e);
  }

  const askFrames = async () => {
    try {
      return await sendMessageToAllFrames(tabId, {
        action: REQUEST_ACTIONS.CHECK_IFRAME_PERMISSION,
        target: REQUEST_TARGETS.CONTENT,
        autofillType,
        dataFields
      });
    } catch (e) {
      await CatchError(e);
      return null;
    }
  };

  let permissionResults = await askFrames();

  const crossDomainHostnames = await discoverCrossDomainHostnames(tabId);

  const collectResponded = results => {
    const respondedNeedsPermission = new Set();
    const respondedNoPermission = new Set();

    if (!Array.isArray(results)) {
      return { respondedNeedsPermission, respondedNoPermission };
    }

    for (const r of results) {
      if (!r || !r.frameInfo?.hostname) {
        continue;
      }

      if (r.needsPermission) {
        respondedNeedsPermission.add(r.frameInfo.hostname);
      } else {
        respondedNoPermission.add(r.frameInfo.hostname);
      }
    }

    return { respondedNeedsPermission, respondedNoPermission };
  };

  let { respondedNeedsPermission, respondedNoPermission } = collectResponded(permissionResults);

  const hasUnresponded = () => {
    for (const hostname of crossDomainHostnames) {
      if (!respondedNeedsPermission.has(hostname) && !respondedNoPermission.has(hostname)) {
        return true;
      }
    }

    return false;
  };

  // If any cross-domain hostname did not respond, retry once after a short delay.
  // Apple's auth widget (and similar) bootstraps slowly; the content script's message
  // listener may not be ready in the first ~300-500ms after injection.
  if (hasUnresponded()) {
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);
    } catch (e) {
      await CatchError(e);
    }

    permissionResults = await askFrames();
    ({ respondedNeedsPermission, respondedNoPermission } = collectResponded(permissionResults));
  }

  // Only cross-domain hostnames whose frame actually reported an autofillable
  // login/card form (needsPermission: true) require a permission decision. A frame
  // that never responded to CHECK_IFRAME_PERMISSION is intentionally NOT flagged:
  // it is denied by default (never added to crossDomainAllowedDomains, so it cannot
  // be silently autofilled), while the user is not prompted to trust unrelated
  // third-party tracking/ad iframes (doubleclick/adsrvr/etc.) that are embedded on
  // the page but hold no login form. The webNavigation-based discovery above and
  // the single retry only exist to give a slow legitimate login iframe a second
  // chance to report itself before we proceed.
  if (respondedNeedsPermission.size === 0) {
    return result;
  }

  let trustedList = [];
  let untrustedList = [];

  try {
    const stored = await storage.getItem('local:crossDomainTrustedDomains');
    trustedList = stored || [];
  } catch { }

  try {
    const stored = await storage.getItem('local:crossDomainUntrustedDomains');
    untrustedList = stored || [];
  } catch { }

  return classifyCrossDomainPermissions(respondedNeedsPermission, trustedList, untrustedList);
};

export default resolveCrossDomainPermissions;
