// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Resolves the effective hostname of the current frame for cross-domain checks.
*
* about:blank / about:srcdoc frames (e.g. iframes created via
* document.createElement('iframe') without src, or via srcdoc) inherit the origin
* of the document that created them, but their own URL exposes no hostname. Their
* effective hostname is read from the parent document, which is same-origin with
* this frame (the origin is inherited), so window.parent.location is readable.
* When the parent is cross-origin (the read throws) the empty hostname is returned
* and the caller treats the frame as cross-domain via its own top-frame check.
* @return {string} The frame's effective hostname, or '' if it cannot be resolved.
*/
const getFrameHostname = () => {
  let href = '';

  try {
    href = window.location.href;
  } catch {
    return '';
  }

  let hostname = '';

  try {
    hostname = new URL(href).hostname;
  } catch {
    return '';
  }

  if (!hostname && (href === 'about:blank' || href === 'about:srcdoc')) {
    try {
      hostname = new URL(window.parent.location.href).hostname;
    } catch {}
  }

  return hostname;
};

export default getFrameHostname;
