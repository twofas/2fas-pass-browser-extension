// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, afterEach } from 'vitest';
import filterInjectableFrames, { RESTRICTED_HOSTS_BY_BROWSER, isRestrictedHostUrl } from './filterInjectableFrames.js';

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

  describe('RESTRICTED_HOSTS_BY_BROWSER (data shape)', () => {
    it('defines a list for every build target', () => {
      expect(Object.keys(RESTRICTED_HOSTS_BY_BROWSER).sort()).toEqual(['chrome', 'edge', 'firefox', 'opera', 'safari']);
    });

    it('shares the Chrome Web Store host across all Chromium targets and leaves Safari empty', () => {
      expect(RESTRICTED_HOSTS_BY_BROWSER.chrome).toContain('chromewebstore.google.com');
      expect(RESTRICTED_HOSTS_BY_BROWSER.edge).toContain('chromewebstore.google.com');
      expect(RESTRICTED_HOSTS_BY_BROWSER.opera).toContain('chromewebstore.google.com');
      expect(RESTRICTED_HOSTS_BY_BROWSER.safari).toEqual([]);
    });

    it('lists the Firefox restricted addons/support domains but not accounts.firefox.com', () => {
      expect(RESTRICTED_HOSTS_BY_BROWSER.firefox).toEqual(expect.arrayContaining([
        'addons.mozilla.org',
        'support.mozilla.org'
      ]));
      expect(RESTRICTED_HOSTS_BY_BROWSER.firefox).not.toContain('accounts.firefox.com');
    });
  });

  describe('isRestrictedHostUrl (browser-specific store / restricted domains)', () => {
    it('flags the Chrome Web Store host on Chromium browsers', () => {
      expect(isRestrictedHostUrl('https://chromewebstore.google.com/detail/x', 'chrome')).toBe(true);
      expect(isRestrictedHostUrl('https://chromewebstore.google.com/detail/x', 'edge')).toBe(true);
      expect(isRestrictedHostUrl('https://chromewebstore.google.com/detail/x', 'opera')).toBe(true);
    });

    it('flags the Edge and Opera add-on stores only on their own browser', () => {
      expect(isRestrictedHostUrl('https://microsoftedge.microsoft.com/addons/x', 'edge')).toBe(true);
      expect(isRestrictedHostUrl('https://microsoftedge.microsoft.com/addons/x', 'chrome')).toBe(false);
      expect(isRestrictedHostUrl('https://addons.opera.com/extensions/x', 'opera')).toBe(true);
      expect(isRestrictedHostUrl('https://addons.opera.com/extensions/x', 'chrome')).toBe(false);
    });

    it('flags Firefox restricted domains only on Firefox', () => {
      expect(isRestrictedHostUrl('https://addons.mozilla.org/firefox', 'firefox')).toBe(true);
      expect(isRestrictedHostUrl('https://support.mozilla.org/kb', 'firefox')).toBe(true);
      // The same hosts are ordinary injectable sites in Chrome — lists must not merge.
      expect(isRestrictedHostUrl('https://addons.mozilla.org/firefox', 'chrome')).toBe(false);
    });

    it('does NOT flag accounts.firefox.com (autofill must run on the Firefox account login)', () => {
      expect(isRestrictedHostUrl('https://accounts.firefox.com/signin', 'firefox')).toBe(false);
    });

    it('treats every host as injectable on Safari (no http(s) restricted hosts)', () => {
      expect(isRestrictedHostUrl('https://chromewebstore.google.com/detail/x', 'safari')).toBe(false);
      expect(isRestrictedHostUrl('https://addons.mozilla.org/firefox', 'safari')).toBe(false);
    });

    it('does not over-match unrelated hosts or unknown browsers', () => {
      expect(isRestrictedHostUrl('https://example.com/chromewebstore.google.com', 'chrome')).toBe(false);
      expect(isRestrictedHostUrl('https://chromewebstore.google.com.evil.com/', 'chrome')).toBe(false);
      expect(isRestrictedHostUrl('not a url', 'chrome')).toBe(false);
      expect(isRestrictedHostUrl('https://chromewebstore.google.com/', 'unknown')).toBe(false);
    });
  });

  describe('restricted hosts are not counted as injectable frames', () => {
    // filterInjectableFrames reads import.meta.env.BROWSER at call time; stub it so
    // the drop behaviour is exercised deterministically for each build target.
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('drops an http(s) frame on the running browser\'s restricted host (chrome)', () => {
      vi.stubEnv('BROWSER', 'chrome');
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'https://chromewebstore.google.com/detail/x' }
      ];
      expect(frameIds(frames)).toEqual([0]);
    });

    it('drops an about:blank child of a restricted-host frame (inherited origin)', () => {
      vi.stubEnv('BROWSER', 'firefox');
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'https://addons.mozilla.org/firefox' },
        { frameId: 2, parentFrameId: 1, url: 'about:blank' }
      ];
      expect(frameIds(frames)).toEqual([0]);
    });

    it('keeps a Firefox-restricted host on Chrome (lists are not merged)', () => {
      vi.stubEnv('BROWSER', 'chrome');
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'https://addons.mozilla.org/firefox' }
      ];
      expect(frameIds(frames)).toEqual([0, 1]);
    });

    it('keeps every host on Safari (no http(s) restricted hosts)', () => {
      vi.stubEnv('BROWSER', 'safari');
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'https://chromewebstore.google.com/detail/x' }
      ];
      expect(frameIds(frames)).toEqual([0, 1]);
    });

    it('keeps an ordinary http(s) frame that is not on a restricted host', () => {
      vi.stubEnv('BROWSER', 'chrome');
      const frames = [
        { frameId: 0, parentFrameId: -1, url: 'https://example.com/' },
        { frameId: 1, parentFrameId: 0, url: 'https://accounts.google.com/signin' }
      ];
      expect(frameIds(frames)).toEqual([0, 1]);
    });
  });

  it('preserves frame objects (not just ids) and original order', () => {
    const top = { frameId: 0, parentFrameId: -1, url: 'https://example.com/' };
    const blank = { frameId: 1, parentFrameId: 0, url: 'about:blank' };
    const ext = { frameId: 2, parentFrameId: 0, url: 'chrome-extension://abc/x' };
    expect(filterInjectableFrames([top, ext, blank])).toEqual([top, blank]);
  });
});
