// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import getShadowRoots from './getShadowRoots.js';

const makeShadowRoot = (children = []) => ({ children });
const makeEl = ({ shadowRoot = null, children = [] } = {}) => ({ shadowRoot, children });

describe('getShadowRoots', () => {
  it('returns an empty array when the subtree has no shadow roots', () => {
    const leaf = makeEl();
    const wrapper = makeEl({ children: [leaf] });
    const body = makeEl({ children: [wrapper] });

    expect(getShadowRoots(body)).toEqual([]);
  });

  it('includes the shadow root of the start element itself', () => {
    const sr = makeShadowRoot();
    const host = makeEl({ shadowRoot: sr });

    const result = getShadowRoots(host);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(sr);
  });

  it('returns shadow roots of light-DOM siblings in document order', () => {
    const sr1 = makeShadowRoot();
    const sr2 = makeShadowRoot();
    const sr3 = makeShadowRoot();
    const body = makeEl({
      children: [
        makeEl({ shadowRoot: sr1 }),
        makeEl({ shadowRoot: sr2 }),
        makeEl({ shadowRoot: sr3 })
      ]
    });

    expect(getShadowRoots(body)).toEqual([sr1, sr2, sr3]);
  });

  it('finds shadow roots nested inside light-DOM descendants', () => {
    const sr = makeShadowRoot();
    const deepHost = makeEl({ shadowRoot: sr });
    const wrapper = makeEl({ children: [deepHost] });
    const body = makeEl({ children: [wrapper] });

    const result = getShadowRoots(body);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(sr);
  });

  it('traverses nested shadow roots depth-first (host inside a shadow tree)', () => {
    const srB = makeShadowRoot();
    const hostB = makeEl({ shadowRoot: srB });
    const srA = makeShadowRoot([hostB]);
    const hostA = makeEl({ shadowRoot: srA });
    const srC = makeShadowRoot();
    const hostC = makeEl({ shadowRoot: srC });
    const body = makeEl({ children: [hostA, hostC] });

    const result = getShadowRoots(body);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(srA);
    expect(result[1]).toBe(srB);
    expect(result[2]).toBe(srC);
  });

  it('processes a host shadow content before its light children', () => {
    const srS = makeShadowRoot();
    const innerHostS = makeEl({ shadowRoot: srS });
    const srX = makeShadowRoot([innerHostS]);
    const srL = makeShadowRoot();
    const lightHostL = makeEl({ shadowRoot: srL });
    const hostX = makeEl({ shadowRoot: srX, children: [lightHostL] });
    const body = makeEl({ children: [hostX] });

    const result = getShadowRoots(body);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(srX);
    expect(result[1]).toBe(srS);
    expect(result[2]).toBe(srL);
  });

  it('falls back to document.body when no element is provided', () => {
    const sr = makeShadowRoot();
    const host = makeEl({ shadowRoot: sr });
    const body = makeEl({ children: [host] });
    const originalDocument = globalThis.document;

    globalThis.document = { body };

    try {
      expect(getShadowRoots()).toEqual([sr]);
      expect(getShadowRoots(null)).toEqual([sr]);
    } finally {
      globalThis.document = originalDocument;
    }
  });

  it('returns an empty array when there is no start element and no document body', () => {
    const originalDocument = globalThis.document;

    globalThis.document = { body: null };

    try {
      expect(getShadowRoots(null)).toEqual([]);
    } finally {
      globalThis.document = originalDocument;
    }
  });
});
