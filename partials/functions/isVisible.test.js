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

const mount = html => {
  document.body.innerHTML = html;

  return document.getElementById('target');
};

describe('isVisible', () => {
  beforeEach(() => {
    // Default every element to a non-zero box; individual tests override per element.
    vi.spyOn(window.Element.prototype, 'getBoundingClientRect').mockReturnValue(VISIBLE_RECT);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
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

  describe('off-screen elements remain targetable (intentional)', () => {
    it('is visible even when positioned far above the viewport', () => {
      const element = mount('<input id="target" />');
      setRect(element, rect(100, 20, { top: -1000, bottom: -980 }));

      expect(isVisible(element)).toBe(true);
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
});
