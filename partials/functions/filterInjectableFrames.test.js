// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import filterInjectableFrames from './filterInjectableFrames.js';

// Shapes mirror browser.webNavigation.getAllFrames results: top frame has
// parentFrameId -1; sub-frames point at their parent's frameId.
const frameIds = frames => filterInjectableFrames(frames).map(f => f.frameId);

describe('filterInjectableFrames', () => {
  describe('guards', () => {
    it('returns [] for non-array input', () => {
      expect(filterInjectableFrames(undefined)).toEqual([]);
      expect(filterInjectableFrames(null)).toEqual([]);
      expect(filterInjectableFrames(false)).toEqual([]);
      expect(filterInjectableFrames({})).toEqual([]);
    });

    it('returns [] for an empty array', () => {
      expect(filterInjectableFrames([])).toEqual([]);
    });

    it('drops frames without a url', () => {
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0 },
        { frameId: 2, parentFrameId: 0, url: '' }
      ];
      expect(frameIds(frames)).toEqual([0]);
    });
  });

  describe('http(s) frames', () => {
    it('keeps http and https frames', () => {
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'http://sub.example.com/login' }
      ];
      expect(frameIds(frames)).toEqual([0, 1]);
    });

    it('drops chrome://, extension and other non-http schemes', () => {
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'chrome://settings' },
        { frameId: 2, parentFrameId: 0, url: 'chrome-extension://abc/page.html' },
        { frameId: 3, parentFrameId: 0, url: 'moz-extension://abc/page.html' },
        { frameId: 4, parentFrameId: 0, url: 'data:text/html,<p>x</p>' }
      ];
      expect(frameIds(frames)).toEqual([0]);
    });
  });

  describe('about:blank / about:srcdoc with http(s) ancestor (the finding)', () => {
    it('keeps an about:blank child of an http(s) top frame', () => {
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'about:blank' }
      ];
      expect(frameIds(frames)).toEqual([0, 1]);
    });

    it('keeps an about:srcdoc child of an http(s) top frame', () => {
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'about:srcdoc' }
      ];
      expect(frameIds(frames)).toEqual([0, 1]);
    });

    it('keeps an about:blank nested under an about:blank that resolves to http(s)', () => {
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'about:blank' },
        { frameId: 2, parentFrameId: 1, url: 'about:srcdoc' }
      ];
      expect(frameIds(frames)).toEqual([0, 1, 2]);
    });

    it('keeps an about:blank under a cross-origin http(s) sub-frame', () => {
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'https://other.com/widget' },
        { frameId: 2, parentFrameId: 1, url: 'about:blank' }
      ];
      expect(frameIds(frames)).toEqual([0, 1, 2]);
    });
  });

  describe('about: frames without an http(s) ancestor', () => {
    it('drops a top-level about:blank frame (no parent)', () => {
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'about:blank' }
      ];
      expect(frameIds(frames)).toEqual([]);
    });

    it('drops an about:blank whose ancestor chain is a non-http scheme', () => {
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'chrome://newtab' },
        { frameId: 1, parentFrameId: 0, url: 'about:blank' }
      ];
      expect(frameIds(frames)).toEqual([]);
    });

    it('drops an about:blank whose parent is missing from the list', () => {
      const frames = [
        { frameId: 2, parentFrameId: 1, url: 'about:blank' }
      ];
      expect(frameIds(frames)).toEqual([]);
    });

    it('does not loop forever on a cyclic parent chain', () => {
      const frames = [
        { frameId: 1, parentFrameId: 2, url: 'about:blank' },
        { frameId: 2, parentFrameId: 1, url: 'about:srcdoc' }
      ];
      expect(frameIds(frames)).toEqual([]);
    });
  });

  it('preserves frame objects (not just ids) and original order', () => {
    const top = { frameId: 0, parentFrameId: -1, url: 'https://example.com/' };
    const blank = { frameId: 1, parentFrameId: 0, url: 'about:blank' };
    const ext = { frameId: 2, parentFrameId: 0, url: 'chrome-extension://abc/x' };
    expect(filterInjectableFrames([top, ext, blank])).toEqual([top, blank]);
  });
});
