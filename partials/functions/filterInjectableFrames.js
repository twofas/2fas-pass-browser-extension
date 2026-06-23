// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Checks whether a frame URL is an http(s) document the content script can run in.
* @param {string} url - The frame URL reported by webNavigation.getAllFrames.
* @return {boolean} True for http:// or https:// URLs.
*/
const isHttpFrameUrl = url => typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));

/**
* Hostnames each browser refuses to run extension content scripts on — its
* add-on store and, for Firefox, the built-in restricted domains
* (extensions.webextensions.restrictedDomains). Such a frame is reported by
* webNavigation like any other http(s) frame, but browser.scripting.executeScript
* never injects into it and it never answers CONTENT_SCRIPT_CHECK. Counting it as
* injectable would raise the injection-verification loop's expected frame count and
* force the full stabilisation penalty (up to 30×50ms + re-injections) on every
* autofill pass over a page embedding one, before settling for just the top frame.
* The lists are browser-specific on purpose: a host restricted in Firefox (e.g.
* addons.mozilla.org) is a perfectly injectable site in Chrome, so they must NOT be
* merged. Sources: Firefox restrictedDomains default; uBlock Origin "Privileged
* Pages". Safari has no http(s) restricted hosts (its safari-web-extension:// pages
* are already excluded by the http(s) check).
* @type {Object<string, Array<string>>}
*/
const RESTRICTED_HOSTS_BY_BROWSER = {
  chrome: ['chromewebstore.google.com'],
  edge: ['chromewebstore.google.com', 'microsoftedge.microsoft.com'],
  opera: ['chromewebstore.google.com', 'addons.opera.com'],
  firefox: [
    // accounts.firefox.com is intentionally NOT listed: we want autofill to run on
    // the Firefox account login page, so it is treated as an ordinary injectable host.
    'accounts-static.cdn.mozilla.net',
    'addons.cdn.mozilla.net',
    'addons.mozilla.org',
    'api.accounts.firefox.com',
    'content.cdn.mozilla.net',
    'discovery.addons.mozilla.org',
    'install.mozilla.org',
    'oauth.accounts.firefox.com',
    'profile.accounts.firefox.com',
    'support.mozilla.org',
    'sync.services.mozilla.com'
  ],
  safari: []
};

/**
* Checks whether an http(s) frame URL points at a host where the given browser
* blocks content-script injection (its add-on store / restricted domains).
* @param {string} url - An http:// or https:// frame URL.
* @param {string} browser - The build target (import.meta.env.BROWSER).
* @return {boolean} True when the host is restricted for that browser.
*/
const isRestrictedHostUrl = (url, browser) => {
  const restrictedHosts = RESTRICTED_HOSTS_BY_BROWSER[browser];

  if (!restrictedHosts || restrictedHosts.length <= 0) {
    return false;
  }

  let hostname;

  try {
    hostname = new URL(url).hostname;
  } catch {
    return false;
  }

  return restrictedHosts.includes(hostname);
};

/**
* Third-party ad / analytics / tag hosts that are embedded as iframes on countless
* sites but never carry a user-facing login (or card) form the extension autofills.
* They DO run the content script (ordinary https), so unlike RESTRICTED_HOSTS they
* answer eventually — but they are routinely slow to bootstrap (their own analytics
* JS saturates the frame's main thread), so counting them in the injection
* -verification expected frame count drags the whole loop into its stabilisation /
* timeout path on every autofill over a tracker-heavy page (measured: ~2.2s on a
* StateFarm login embedding 6 of these). Dropping them shrinks the messaged set and
* the expected frame count to the frames that can actually hold a login form.
*
* Entries are matched as the hostname itself OR any subdomain of it. Pure ad/analytics
* networks are listed by registrable domain (every subdomain is theirs). Companies
* whose PARENT domain can host a genuine login (Snapchat, Bing, LinkedIn, TikTok,
* Facebook) are listed ONLY by their exact tracking sub-host, never the eTLD+1, so a
* real login iframe on the parent domain stays injectable. The list is deliberately
* conservative and incomplete: a tracker not listed here simply falls back to the
* previous (slower) behaviour — it is never wrongly autofilled.
* @type {ReadonlyArray<string>}
*/
const TRACKER_HOSTS = Object.freeze([
  'doubleclick.net',
  'google-analytics.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'googleadservices.com',
  'demdex.net',
  'omtrdc.net',
  'adsrvr.org',
  'adnxs.com',
  'rubiconproject.com',
  'pubmatic.com',
  'casalemedia.com',
  'bidswitch.net',
  'criteo.com',
  'criteo.net',
  'amazon-adsystem.com',
  'rlcdn.com',
  'crwdcntrl.net',
  'agkn.com',
  'optimizely.com',
  'hotjar.com',
  'mouseflow.com',
  'taboola.com',
  'outbrain.com',
  'scorecardresearch.com',
  'quantserve.com',
  'sc-static.net',
  'tr.snapchat.com',
  'bat.bing.com',
  'px.ads.linkedin.com',
  'analytics.tiktok.com',
  'connect.facebook.net'
]);

/**
* Checks whether an http(s) frame URL points at a known third-party ad/analytics host
* (TRACKER_HOSTS) — the hostname itself or any subdomain of a listed entry.
* @param {string} url - An http:// or https:// frame URL.
* @return {boolean} True when the host is a known tracker that holds no login form.
*/
const isTrackerHostUrl = url => {
  let hostname;

  try {
    hostname = new URL(url).hostname;
  } catch {
    return false;
  }

  return TRACKER_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
};

/**
* Checks whether a frame URL is an inherited-origin document (about:blank /
* about:srcdoc). Such frames have no origin of their own — they inherit the
* origin of the document that created them — so their own URL is not enough to
* decide injectability; the parent chain must be inspected.
* @param {string} url - The frame URL reported by webNavigation.getAllFrames.
* @return {boolean} True for about:blank / about:srcdoc URLs.
*/
const isInheritedOriginFrameUrl = url => url === 'about:blank' || url === 'about:srcdoc';

/**
* Filters webNavigation frames down to those that can host the content script.
*
* A frame is injectable when its own URL is http(s), OR it is an inherited-origin
* frame (about:blank / about:srcdoc — typically created via
* document.createElement('iframe') without src, or via srcdoc) whose ancestor
* chain resolves to an http(s) frame. The latter are same-origin with their
* http(s) creator (origin is inherited) and the content script reaches them via
* match_about_blank, but webNavigation reports them with an about: URL, so they
* must be matched through the parent rather than filtered out blindly. Non-same
* -origin cases are still gated by the cross-domain permission checks in autofill.
*
* http(s) frames on a browser-restricted host (add-on store / Firefox restricted
* domains) are dropped — the browser never injects there, so counting them would
* stall the injection-verification loop. An inherited-origin frame inherits its
* creator's origin, so one whose ancestor resolves to a restricted host is dropped
* too.
* @param {Array<Object>} frames - Frames from browser.webNavigation.getAllFrames.
* @return {Array<Object>} The subset of frames that can host the content script.
*/
const filterInjectableFrames = frames => {
  if (!Array.isArray(frames) || frames.length <= 0) {
    return [];
  }

  const currentBrowser = import.meta.env.BROWSER;
  const framesById = new Map(frames.map(frame => [frame.frameId, frame]));

  const ancestorIsHttp = (frame, seen) => {
    if (!frame || seen.has(frame.frameId)) {
      return false;
    }

    seen.add(frame.frameId);

    const parent = framesById.get(frame.parentFrameId);

    if (!parent) {
      return false;
    }

    if (isHttpFrameUrl(parent.url)) {
      return !isRestrictedHostUrl(parent.url, currentBrowser) && !isTrackerHostUrl(parent.url);
    }

    if (isInheritedOriginFrameUrl(parent.url)) {
      return ancestorIsHttp(parent, seen);
    }

    return false;
  };

  return frames.filter(frame => {
    if (!frame || !frame.url) {
      return false;
    }

    if (isHttpFrameUrl(frame.url)) {
      return !isRestrictedHostUrl(frame.url, currentBrowser) && !isTrackerHostUrl(frame.url);
    }

    if (isInheritedOriginFrameUrl(frame.url)) {
      return ancestorIsHttp(frame, new Set());
    }

    return false;
  });
};

export { RESTRICTED_HOSTS_BY_BROWSER, isRestrictedHostUrl, TRACKER_HOSTS, isTrackerHostUrl };
export default filterInjectableFrames;
