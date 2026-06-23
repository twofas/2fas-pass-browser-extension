// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests for the visibility heuristic. jsdom has no layout engine, so
// getBoundingClientRect is stubbed to control element size; everything else uses
// the real DOM + real getComputedStyle (which jsdom resolves from inline styles).
// jsdom does not implement checkVisibility, so the manual ancestor-walk fallback
// is exercised by default and the native-API path is opted into per test.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import isVisible from './isVisible';

const rect = (width, height, extra = {}) => ({
  width,
  height,
  top: 0,
  left: 0,
  right: width,
  bottom: height,
  x: 0,
  y: 0,
  toJSON: () => ({}),
  ...extra
});

const VISIBLE_RECT = rect(100, 20);

const setRect = (element, value) => {
  element.getBoundingClientRect = () => value;
};

const setScroll = (x, y) => {
  Object.defineProperty(window, 'scrollX', { value: x, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
};

const defineProps = (element, props) => {
  Object.keys(props).forEach(key => {
    Object.defineProperty(element, key, { value: props[key], configurable: true });
  });
};

const mount = html => {
  document.body.innerHTML = html;

  return document.getElementById('target');
};

describe('isVisible', () => {
  beforeEach(() => {
    // Default every element to a non-zero box; individual tests override per element.
    vi.spyOn(window.Element.prototype, 'getBoundingClientRect').mockReturnValue(VISIBLE_RECT);
    // jsdom has no layout: give the document a large scrollable area and reset
    // page scroll so the viewport reachability check has realistic bounds.
    setScroll(0, 0);
    defineProps(document.documentElement, { scrollWidth: 100000, scrollHeight: 100000 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    setScroll(0, 0);
  });

  describe('guards', () => {
    it('returns false for a null element', () => {
      expect(isVisible(null)).toBe(false);
    });

    it('returns false for an undefined element', () => {
      expect(isVisible(undefined)).toBe(false);
    });
  });

  describe('a plainly rendered element', () => {
    it('is visible', () => {
      expect(isVisible(mount('<input id="target" />'))).toBe(true);
    });
  });

  describe('zero dimensions', () => {
    it('is hidden when the element has zero width', () => {
      const element = mount('<input id="target" />');
      setRect(element, rect(0, 20));

      expect(isVisible(element)).toBe(false);
    });

    it('is hidden when the element has zero height', () => {
      const element = mount('<input id="target" />');
      setRect(element, rect(100, 0));

      expect(isVisible(element)).toBe(false);
    });
  });

  describe('the element own computed style', () => {
    it('is hidden when display is none', () => {
      expect(isVisible(mount('<input id="target" style="display:none" />'))).toBe(false);
    });

    it('is hidden when visibility is hidden', () => {
      expect(isVisible(mount('<input id="target" style="visibility:hidden" />'))).toBe(false);
    });

    it('is hidden when clipped to a zero rect', () => {
      expect(isVisible(mount('<input id="target" style="clip:rect(0px, 0px, 0px, 0px)" />'))).toBe(false);
    });

    it('is hidden when clipped via clip-path inset(100%)', () => {
      expect(isVisible(mount('<input id="target" style="clip-path:inset(100%)" />'))).toBe(false);
    });
  });

  describe('off-screen position relative to the document', () => {
    it('is hidden when positioned entirely off-screen to the left (e.g. left:-9999px, unreachable)', () => {
      const element = mount('<input id="target" />');
      setRect(element, rect(100, 20, { left: -9999, right: -9899 }));

      expect(isVisible(element)).toBe(false);
    });

    it('is hidden when positioned entirely above the document origin (unreachable)', () => {
      const element = mount('<input id="target" />');
      setRect(element, rect(100, 20, { top: -9999, bottom: -9979 }));

      expect(isVisible(element)).toBe(false);
    });

    it('stays visible when below the fold (reachable by scrolling down)', () => {
      const element = mount('<input id="target" />');
      setRect(element, rect(100, 20, { top: 5000, bottom: 5020 }));

      expect(isVisible(element)).toBe(true);
    });

    it('stays visible when scrolled above the viewport but reachable by scrolling up', () => {
      const element = mount('<input id="target" />');
      // Currently rendered above the viewport, but the page is scrolled down, so
      // the element's document position is positive and reachable by scrolling up.
      setRect(element, rect(100, 20, { top: -1000, bottom: -980 }));
      setScroll(0, 2000);

      expect(isVisible(element)).toBe(true);
    });
  });

  describe('scrollable containers', () => {
    const mountInContainer = (containerStyle, containerRect, containerProps) => {
      document.body.innerHTML = `<div id="container" style="${containerStyle}"><input id="target" /></div>`;
      const container = document.getElementById('container');
      const target = document.getElementById('target');
      setRect(container, containerRect);
      defineProps(container, containerProps);

      return target;
    };

    it('stays visible when scrolled out of a scrollable container but reachable by scrolling it', () => {
      const target = mountInContainer(
        'overflow-x: auto; overflow-y: auto',
        rect(200, 200, { top: 50, left: 0, right: 200, bottom: 250 }),
        { clientWidth: 200, clientHeight: 200, scrollWidth: 200, scrollHeight: 2000, scrollLeft: 0, scrollTop: 1050 }
      );
      // Currently rendered above the container's view, but scrolling it up reveals it.
      setRect(target, rect(100, 20, { top: -1000, left: 10, right: 110, bottom: -980 }));

      expect(isVisible(target)).toBe(true);
    });

    it('stays visible when within the current view of a scrolled container', () => {
      const target = mountInContainer(
        'overflow-x: auto; overflow-y: auto',
        rect(200, 200, { top: 50, left: 0, right: 200, bottom: 250 }),
        { clientWidth: 200, clientHeight: 200, scrollWidth: 200, scrollHeight: 2000, scrollLeft: 0, scrollTop: 1050 }
      );
      setRect(target, rect(100, 20, { top: 100, left: 10, right: 110, bottom: 120 }));

      expect(isVisible(target)).toBe(true);
    });

    it('is hidden when parked above a scrollable container beyond its scroll range', () => {
      const target = mountInContainer(
        'overflow-x: auto; overflow-y: auto',
        rect(200, 200, { top: 50, left: 0, right: 200, bottom: 250 }),
        { clientWidth: 200, clientHeight: 200, scrollWidth: 200, scrollHeight: 2000, scrollLeft: 0, scrollTop: 0 }
      );
      // Above the container with no scroll-up room left (scrollTop already 0).
      setRect(target, rect(100, 20, { top: -100, left: 10, right: 110, bottom: -80 }));

      expect(isVisible(target)).toBe(false);
    });

    it('is hidden when positioned outside a non-scrollable overflow:hidden container', () => {
      const target = mountInContainer(
        'overflow-x: hidden; overflow-y: hidden',
        rect(200, 200, { top: 50, left: 0, right: 200, bottom: 250 }),
        { clientWidth: 200, clientHeight: 200, scrollWidth: 200, scrollHeight: 200, scrollLeft: 0, scrollTop: 0 }
      );
      // Below the visible client box; a hidden box is not user-scrollable.
      setRect(target, rect(100, 20, { top: 400, left: 10, right: 110, bottom: 420 }));

      expect(isVisible(target)).toBe(false);
    });

    it('stays visible inside nested scroll containers when reachable through both', () => {
      document.body.innerHTML = '<div id="outer" style="overflow-x: auto; overflow-y: auto"><div id="inner" style="overflow-x: auto; overflow-y: auto"><input id="target" /></div></div>';
      const outer = document.getElementById('outer');
      const inner = document.getElementById('inner');
      const target = document.getElementById('target');
      setRect(outer, rect(300, 300, { top: 0, left: 0, right: 300, bottom: 300 }));
      defineProps(outer, { clientWidth: 300, clientHeight: 300, scrollWidth: 300, scrollHeight: 1000, scrollLeft: 0, scrollTop: 600 });
      setRect(inner, rect(300, 200, { top: -300, left: 0, right: 300, bottom: -100 }));
      defineProps(inner, { clientWidth: 300, clientHeight: 200, scrollWidth: 300, scrollHeight: 800, scrollLeft: 0, scrollTop: 400 });
      setRect(target, rect(100, 20, { top: -700, left: 10, right: 110, bottom: -680 }));

      expect(isVisible(target)).toBe(true);
    });
  });

  describe('ancestor visibility (manual fallback walk)', () => {
    const mountNested = wrapperStyle => mount(`<div style="${wrapperStyle}"><input id="target" /></div>`);

    it('is hidden when an ancestor has display none', () => {
      expect(isVisible(mountNested('display:none'))).toBe(false);
    });

    it('is hidden when an ancestor has visibility hidden', () => {
      expect(isVisible(mountNested('visibility:hidden'))).toBe(false);
    });

    it('is hidden when an ancestor has opacity 0', () => {
      expect(isVisible(mountNested('opacity:0'))).toBe(false);
    });

    it('is hidden when a zero-sized ancestor clips its overflow', () => {
      const element = mountNested('overflow:hidden');
      setRect(element.parentElement, rect(0, 0));

      expect(isVisible(element)).toBe(false);
    });

    it('stays visible when a zero-sized ancestor lets overflow show', () => {
      const element = mountNested('overflow:visible');
      setRect(element.parentElement, rect(0, 0));

      expect(isVisible(element)).toBe(true);
    });

    it('ignores the size of a display:contents ancestor', () => {
      const element = mountNested('display:contents');
      setRect(element.parentElement, rect(0, 0));

      expect(isVisible(element)).toBe(true);
    });

    it('is visible when every ancestor is visible', () => {
      expect(isVisible(mountNested('display:block'))).toBe(true);
    });
  });

  describe('native checkVisibility (when the browser provides it)', () => {
    it('is hidden when checkVisibility reports the element is not visible', () => {
      const element = mount('<input id="target" />');
      element.checkVisibility = () => false;

      expect(isVisible(element)).toBe(false);
    });

    it('still enforces the element own computed style when checkVisibility is true', () => {
      const element = mount('<input id="target" style="display:none" />');
      element.checkVisibility = () => true;

      expect(isVisible(element)).toBe(false);
    });

    it('trusts checkVisibility for ancestors and skips the manual walk', () => {
      const element = mount('<div style="display:none"><input id="target" /></div>');
      element.checkVisibility = () => true;

      // The display:none ancestor would fail the manual walk, but with the native
      // API available isVisible relies on it and does not re-check ancestors.
      expect(isVisible(element)).toBe(true);
    });
  });

  describe('positioned elements that escape ancestor overflow clipping (review #1)', () => {
    // fixed/absolute/sticky elements are not clipped by a non-transformed overflow:hidden
    // ancestor the way in-flow elements are (fixed resolves against the viewport, absolute
    // against its containing block — which may sit above an intermediate overflow — and sticky
    // shifts to stay in view). The reachability walk must NOT geometrically reject them just
    // because their box lies outside an ancestor's client box.
    const mountPositioned = (position, targetRect) => {
      document.body.innerHTML = `<div id="container" style="overflow-x: hidden; overflow-y: hidden"><input id="target" style="position: ${position}" /></div>`;
      const container = document.getElementById('container');
      const target = document.getElementById('target');
      setRect(container, rect(200, 200, { top: 50, left: 0, right: 200, bottom: 250 }));
      defineProps(container, { clientWidth: 200, clientHeight: 200, scrollWidth: 200, scrollHeight: 200, scrollLeft: 0, scrollTop: 0 });
      setRect(target, targetRect);

      return target;
    };

    it('stays visible for a position:fixed element rendered outside an overflow:hidden ancestor', () => {
      // Rendered far below the clipping container's box but inside the viewport.
      const target = mountPositioned('fixed', rect(100, 20, { top: 600, left: 10, right: 110, bottom: 620 }));

      expect(isVisible(target)).toBe(true);
    });

    it('stays visible for a position:absolute element rendered outside an overflow:hidden ancestor', () => {
      const target = mountPositioned('absolute', rect(100, 20, { top: 600, left: 10, right: 110, bottom: 620 }));

      expect(isVisible(target)).toBe(true);
    });

    it('stays visible for a position:sticky element rendered outside an overflow:hidden ancestor', () => {
      const target = mountPositioned('sticky', rect(100, 20, { top: 600, left: 10, right: 110, bottom: 620 }));

      expect(isVisible(target)).toBe(true);
    });

    it('still hides a position:fixed element parked off-screen (the viewport check still applies)', () => {
      const target = mountPositioned('fixed', rect(100, 20, { top: 0, left: -9999, right: -9899, bottom: 20 }));

      expect(isVisible(target)).toBe(false);
    });
  });
});
