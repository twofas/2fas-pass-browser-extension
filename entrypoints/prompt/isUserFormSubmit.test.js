// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// form.requestSubmit() called by the page fires a trusted submit event, so a submit counts as the user's only while the
// page has a transient user activation (a click or key press moments before).

import { describe, it, expect, afterEach, vi } from 'vitest';
import isUserFormSubmit from './isUserFormSubmit';

const stubActivation = isActive => vi.stubGlobal('navigator', { ...navigator, userActivation: { isActive } });

describe('isUserFormSubmit', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('counts a trusted submit right after a user gesture', () => {
    stubActivation(true);

    expect(isUserFormSubmit({ isTrusted: true })).toBe(true);
  });

  it('ignores a submit the page triggered long after the last user gesture', () => {
    stubActivation(false);

    expect(isUserFormSubmit({ isTrusted: true })).toBe(false);
  });

  it('ignores a submit event dispatched from a script', () => {
    stubActivation(true);

    expect(isUserFormSubmit({ isTrusted: false })).toBe(false);
  });

  it('relies on isTrusted alone where the browser has no user activation API', () => {
    vi.stubGlobal('navigator', { userAgent: 'x' });

    expect(isUserFormSubmit({ isTrusted: true })).toBe(true);
  });
});
