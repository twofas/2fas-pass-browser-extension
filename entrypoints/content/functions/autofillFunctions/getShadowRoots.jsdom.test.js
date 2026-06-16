// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Real-DOM coverage for getShadowRoots. The sibling getShadowRoots.test.js exercises
// the traversal algorithm with hand-built fakes; this file verifies the behaviour
// against an actual jsdom tree built with attachShadow — including the contract that
// closed shadow roots are invisible to detection.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import getShadowRoots from './getShadowRoots.js';

const attachOpenShadow = host => host.attachShadow({ mode: 'open' });

describe('getShadowRoots (real shadow DOM)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
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

  it('does not expose a closed shadow root', () => {
    document.body.innerHTML = '<div id="host"></div>';
    document.getElementById('host').attachShadow({ mode: 'closed' });

    expect(getShadowRoots(document.body)).toEqual([]);
  });

  it('finds open shadow roots while skipping a closed sibling', () => {
    document.body.innerHTML = '<div id="open"></div><div id="closed"></div>';
    const openRoot = attachOpenShadow(document.getElementById('open'));
    document.getElementById('closed').attachShadow({ mode: 'closed' });

    expect(getShadowRoots(document.body)).toEqual([openRoot]);
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
