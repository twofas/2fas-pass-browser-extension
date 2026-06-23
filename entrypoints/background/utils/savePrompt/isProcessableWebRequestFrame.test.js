// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import isProcessableWebRequestFrame, { isOutermostFrame, getFrameOriginUrl } from './isProcessableWebRequestFrame.js';

describe('isOutermostFrame', () => {
  it('uses frameType when present (Chromium)', () => {
    expect(isOutermostFrame({ frameType: 'outermost_frame' })).toBe(true);
    expect(isOutermostFrame({ frameType: 'sub_frame' })).toBe(false);
    expect(isOutermostFrame({ frameType: 'fenced_frame' })).toBe(false);
  });

  it('falls back to parentFrameId === -1 (Firefox, no frameType)', () => {
    expect(isOutermostFrame({ parentFrameId: -1 })).toBe(true);
    expect(isOutermostFrame({ parentFrameId: 0 })).toBe(false);
    expect(isOutermostFrame({ parentFrameId: 5 })).toBe(false);
  });
});

describe('getFrameOriginUrl', () => {
  it('prefers Chromium initiator, then Firefox originUrl, then documentUrl', () => {
    expect(getFrameOriginUrl({ initiator: 'https://a.com', originUrl: 'https://b.com/x' })).toBe('https://a.com');
    expect(getFrameOriginUrl({ originUrl: 'https://b.com/x', documentUrl: 'https://c.com/y' })).toBe('https://b.com/x');
    expect(getFrameOriginUrl({ documentUrl: 'https://c.com/y' })).toBe('https://c.com/y');
  });

  it('returns "" when no frame-origin field is present (never falls back to tab url)', () => {
    expect(getFrameOriginUrl({ url: 'https://target.com/login' })).toBe('');
    expect(getFrameOriginUrl({})).toBe('');
  });
});

describe('isProcessableWebRequestFrame', () => {
  it('always processes the top document (Chromium + Firefox shapes)', () => {
    expect(isProcessableWebRequestFrame({ frameType: 'outermost_frame' }, 'https://example.com/')).toBe(true);
    expect(isProcessableWebRequestFrame({ parentFrameId: -1 }, 'https://example.com/')).toBe(true);
    // Top frame is processable even if the tab url is unknown.
    expect(isProcessableWebRequestFrame({ frameType: 'outermost_frame' }, undefined)).toBe(true);
  });

  it('processes a same-root-domain sub-frame (login form in a same-site iframe)', () => {
    const details = { frameType: 'sub_frame', initiator: 'https://login.example.com' };
    expect(isProcessableWebRequestFrame(details, 'https://www.example.com/')).toBe(true);
  });

  it('processes a same-origin sub-frame via Firefox documentUrl', () => {
    const details = { parentFrameId: 0, documentUrl: 'https://example.com/iframe.html' };
    expect(isProcessableWebRequestFrame(details, 'https://example.com/')).toBe(true);
  });

  it('rejects a cross-root-domain sub-frame (e.g. SSO widget)', () => {
    const details = { frameType: 'sub_frame', initiator: 'https://accounts.google.com' };
    expect(isProcessableWebRequestFrame(details, 'https://example.com/')).toBe(false);
  });

  it('rejects a sub-frame with no resolvable frame origin (fail-closed)', () => {
    expect(isProcessableWebRequestFrame({ frameType: 'sub_frame' }, 'https://example.com/')).toBe(false);
    expect(isProcessableWebRequestFrame({ parentFrameId: 0 }, 'https://example.com/')).toBe(false);
  });

  it('rejects a sub-frame when the tab url is unknown', () => {
    const details = { frameType: 'sub_frame', initiator: 'https://example.com' };
    expect(isProcessableWebRequestFrame(details, undefined)).toBe(false);
  });
});
