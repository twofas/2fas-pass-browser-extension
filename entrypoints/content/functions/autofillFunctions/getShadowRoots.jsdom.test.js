// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Real-DOM coverage for getShadowRoots. The sibling getShadowRoots.test.js exercises
// the traversal algorithm with hand-built fakes; this file verifies the behaviour
// against an actual jsdom tree built with attachShadow. Closed shadow roots are read
// via a privileged open-or-closed API (browser.dom.openOrClosedShadowRoot on Chromium,
// element.openOrClosedShadowRoot on Firefox) that jsdom does not implement, so it is
// stubbed here to mirror those engines; with no stub, jsdom matches Safari (open-only).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getShadowRoots from './getShadowRoots.js';

const attachOpenShadow = host => host.attachShadow({ mode: 'open' });

// Mirrors Chromium's browser.dom.openOrClosedShadowRoot: jsdom keeps the closed root
// reachable from the host, so resolve it the same way Chromium's privileged API would.
const stubChromiumOpenOrClosedApi = closedRootsByHost => {
  browser.dom = {
    openOrClosedShadowRoot: vi.fn(host => closedRootsByHost.get(host) ?? null)
  };
};

describe('getShadowRoots (real shadow DOM)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete browser.dom;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete browser.dom;
  });

  it('returns an empty array for a tree with no shadow roots', () => {
    document.body.innerHTML = '<div><section><input /></section></div>';

    expect(getShadowRoots(document.body)).toEqual([]);
  });

  it('finds a single open shadow root', () => {
    document.body.innerHTML = '<div id="host"></div>';
    const root = attachOpenShadow(document.getElementById('host'));

    const result = getShadowRoots(document.body);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(root);
  });

  it('finds open shadow roots on several sibling hosts', () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div><div id="c"></div>';
    const rootA = attachOpenShadow(document.getElementById('a'));
    const rootB = attachOpenShadow(document.getElementById('b'));
    const rootC = attachOpenShadow(document.getElementById('c'));

    const result = getShadowRoots(document.body);

    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining([rootA, rootB, rootC]));
  });

  it('finds a shadow root nested deep inside the light DOM', () => {
    document.body.innerHTML = '<div><section><span id="host"></span></section></div>';
    const root = attachOpenShadow(document.getElementById('host'));

    expect(getShadowRoots(document.body)).toEqual([root]);
  });

  it('finds a shadow root nested inside another shadow root', () => {
    document.body.innerHTML = '<div id="outer"></div>';
    const outerRoot = attachOpenShadow(document.getElementById('outer'));

    outerRoot.innerHTML = '<div id="inner"></div>';
    const innerRoot = attachOpenShadow(outerRoot.getElementById('inner'));

    const result = getShadowRoots(document.body);

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([outerRoot, innerRoot]));
  });

  it('does not expose a closed shadow root when no open-or-closed API is available (Safari)', () => {
    document.body.innerHTML = '<div id="host"></div>';
    document.getElementById('host').attachShadow({ mode: 'closed' });

    expect(getShadowRoots(document.body)).toEqual([]);
  });

  it('finds open shadow roots while skipping a closed sibling with no open-or-closed API (Safari)', () => {
    document.body.innerHTML = '<div id="open"></div><div id="closed"></div>';
    const openRoot = attachOpenShadow(document.getElementById('open'));
    document.getElementById('closed').attachShadow({ mode: 'closed' });

    expect(getShadowRoots(document.body)).toEqual([openRoot]);
  });

  it('exposes a closed shadow root through the open-or-closed API (Chromium/Firefox)', () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host');
    const closedRoot = host.attachShadow({ mode: 'closed' });

    stubChromiumOpenOrClosedApi(new Map([[host, closedRoot]]));

    expect(getShadowRoots(document.body)).toEqual([closedRoot]);
  });

  it('finds both open and closed sibling shadow roots through the open-or-closed API', () => {
    document.body.innerHTML = '<div id="open"></div><div id="closed"></div>';
    const openRoot = attachOpenShadow(document.getElementById('open'));
    const closedHost = document.getElementById('closed');
    const closedRoot = closedHost.attachShadow({ mode: 'closed' });

    stubChromiumOpenOrClosedApi(new Map([[closedHost, closedRoot]]));

    const result = getShadowRoots(document.body);

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([openRoot, closedRoot]));
  });

  it('descends into the light children of a closed shadow root to find nested hosts', () => {
    document.body.innerHTML = '<div id="outer"></div>';
    const outerHost = document.getElementById('outer');
    const closedOuter = outerHost.attachShadow({ mode: 'closed' });

    closedOuter.innerHTML = '<div id="inner"></div>';
    const innerRoot = attachOpenShadow(closedOuter.getElementById('inner'));

    stubChromiumOpenOrClosedApi(new Map([[outerHost, closedOuter]]));

    const result = getShadowRoots(document.body);

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([closedOuter, innerRoot]));
  });

  it('scans from an explicitly provided root element', () => {
    document.body.innerHTML = '<div id="scope"><div id="host"></div></div><div id="outside"></div>';
    const inScope = attachOpenShadow(document.getElementById('host'));
    attachOpenShadow(document.getElementById('outside'));

    const result = getShadowRoots(document.getElementById('scope'));

    expect(result).toEqual([inScope]);
  });

  it('defaults to document.body when called with no element', () => {
    document.body.innerHTML = '<div id="host"></div>';
    const root = attachOpenShadow(document.getElementById('host'));

    expect(getShadowRoots()).toEqual([root]);
  });
});
