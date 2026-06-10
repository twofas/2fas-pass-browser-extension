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
* @param {Array<Object>} frames - Frames from browser.webNavigation.getAllFrames.
* @return {Array<Object>} The subset of frames that can host the content script.
*/
const filterInjectableFrames = frames => {
  if (!Array.isArray(frames) || frames.length <= 0) {
    return [];
  }

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
      return true;
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
      return true;
    }

    if (isInheritedOriginFrameUrl(frame.url)) {
      return ancestorIsHttp(frame, new Set());
    }

    return false;
  });
};

export default filterInjectableFrames;
