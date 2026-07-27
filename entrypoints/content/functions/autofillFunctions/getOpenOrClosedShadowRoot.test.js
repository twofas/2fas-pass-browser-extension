// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Verifies the per-browser shadow-root resolution that lets autofill see inside
// closed (mode: 'closed') shadow roots. jsdom exposes neither browser.dom.openOrClosedShadowRoot
// (Chromium) nor element.openOrClosedShadowRoot (Firefox), so those privileged APIs are
// stubbed to mirror each engine, while open roots and the candidate guard run against a
// real jsdom tree. The page is never modified — closed roots are read in place.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getOpenOrClosedShadowRoot from './getOpenOrClosedShadowRoot.js';

const mountHost = html => {
  document.body.innerHTML = html;

  return document.body.firstElementChild;
};

describe('getOpenOrClosedShadowRoot', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete browser.dom;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete browser.dom;
  });

  it('returns null when no element is provided', () => {
    expect(getOpenOrClosedShadowRoot(null)).toBeNull();
    expect(getOpenOrClosedShadowRoot(undefined)).toBeNull();
  });

  it('returns an open shadow root straight from element.shadowRoot', () => {
    const host = mountHost('<div></div>');
    const root = host.attachShadow({ mode: 'open' });

    expect(getOpenOrClosedShadowRoot(host)).toBe(root);
  });

  it('returns null for a non-host element without invoking the privileged API', () => {
    const input = mountHost('<input />');
    const openOrClosedShadowRoot = vi.fn();

    browser.dom = { openOrClosedShadowRoot };

    expect(getOpenOrClosedShadowRoot(input)).toBeNull();
    expect(openOrClosedShadowRoot).not.toHaveBeenCalled();
  });

  it('reads a closed root via browser.dom.openOrClosedShadowRoot on Chromium', () => {
    const host = mountHost('<div></div>');
    const closedRoot = host.attachShadow({ mode: 'closed' });
    const openOrClosedShadowRoot = vi.fn(() => closedRoot);

    browser.dom = { openOrClosedShadowRoot };

    expect(getOpenOrClosedShadowRoot(host)).toBe(closedRoot);
    expect(openOrClosedShadowRoot).toHaveBeenCalledWith(host);
    // The page-facing API stays closed: el.shadowRoot is never opened up.
    expect(host.shadowRoot).toBeNull();
  });

  it('treats a custom element (hyphenated node name) as a shadow-host candidate', () => {
    const host = mountHost('<my-widget></my-widget>');
    const closedRoot = host.attachShadow({ mode: 'closed' });
    const openOrClosedShadowRoot = vi.fn(() => closedRoot);

    browser.dom = { openOrClosedShadowRoot };

    expect(getOpenOrClosedShadowRoot(host)).toBe(closedRoot);
    expect(openOrClosedShadowRoot).toHaveBeenCalledWith(host);
  });

  it('returns null when browser.dom.openOrClosedShadowRoot throws', () => {
    const host = mountHost('<div></div>');

    host.attachShadow({ mode: 'closed' });
    browser.dom = {
      openOrClosedShadowRoot: vi.fn(() => {
        throw new Error('blocked');
      })
    };

    expect(getOpenOrClosedShadowRoot(host)).toBeNull();
  });

  it('reads a closed root via element.openOrClosedShadowRoot on Firefox', () => {
    const host = mountHost('<div></div>');
    const closedRoot = host.attachShadow({ mode: 'closed' });

    Object.defineProperty(host, 'openOrClosedShadowRoot', {
      configurable: true,
      get: () => closedRoot
    });

    expect(getOpenOrClosedShadowRoot(host)).toBe(closedRoot);
  });

  it('returns null when element.openOrClosedShadowRoot throws on Firefox', () => {
    const host = mountHost('<div></div>');

    host.attachShadow({ mode: 'closed' });

    Object.defineProperty(host, 'openOrClosedShadowRoot', {
      configurable: true,
      get: () => {
        throw new Error('blocked');
      }
    });

    expect(getOpenOrClosedShadowRoot(host)).toBeNull();
  });

  it('returns null when element.shadowRoot throws on a dead wrapper', () => {
    const host = mountHost('<div></div>');

    Object.defineProperty(host, 'shadowRoot', {
      configurable: true,
      get: () => {
        throw new Error('can\'t access dead object');
      }
    });

    expect(getOpenOrClosedShadowRoot(host)).toBeNull();
  });

  it('returns null when neither privileged API exists, as on Safari below 26', () => {
    const host = mountHost('<div></div>');

    host.attachShadow({ mode: 'closed' });

    expect(getOpenOrClosedShadowRoot(host)).toBeNull();
  });
});
