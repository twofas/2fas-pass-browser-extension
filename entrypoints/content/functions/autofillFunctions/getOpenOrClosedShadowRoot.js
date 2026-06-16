// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Element node names that are allowed to host a shadow root per the HTML spec's
* attachShadow() allow-list. A closed shadow root can only ever be attached to one
* of these elements or to a custom element (its node name contains a hyphen), so the
* privileged open-or-closed lookup is attempted only for these candidates — every
* other element is skipped without a per-node privileged call, keeping the traversal
* hot path cheap (see getShadowRoots).
* @type {Readonly<Set<string>>}
*/
const SHADOW_ROOT_CANDIDATE_NODE_NAMES = Object.freeze(new Set([
  'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BODY', 'DIV', 'FOOTER',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'MAIN', 'NAV', 'P', 'SECTION', 'SPAN'
]));

/**
* Resolves an element's shadow root, including closed ones (mode: 'closed') where the
* browser exposes a privileged content-script API for them. Open roots come straight
* from element.shadowRoot; closed roots are read in place — the page is never modified —
* via browser.dom.openOrClosedShadowRoot on Chromium (browser maps to chrome there) or
* element.openOrClosedShadowRoot on Firefox. Safari exposes neither API, so closed roots
* stay invisible there and the function degrades to open-only.
* @param {Element|null} element - The element whose shadow root should be resolved.
* @return {ShadowRoot|null} The element's open or closed shadow root, or null when none is accessible.
*/
const getOpenOrClosedShadowRoot = element => {
  if (!element) {
    return null;
  }

  if (element.shadowRoot) {
    return element.shadowRoot;
  }

  const nodeName = element.nodeName;
  const isCandidate = SHADOW_ROOT_CANDIDATE_NODE_NAMES.has(nodeName) || Boolean(nodeName?.includes('-'));

  if (!isCandidate) {
    return null;
  }

  if (browser?.dom?.openOrClosedShadowRoot) {
    try {
      return browser.dom.openOrClosedShadowRoot(element);
    } catch {
      return null;
    }
  }

  return element.openOrClosedShadowRoot ?? null;
};

export default getOpenOrClosedShadowRoot;
