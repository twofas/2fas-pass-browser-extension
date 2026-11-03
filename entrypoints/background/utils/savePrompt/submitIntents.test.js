// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// A login form submitted by the user (click, Enter, submit) is evidence that the request sent right after it carries
// the typed password, even when the page transforms the password before sending it.

import { describe, it, expect, beforeEach } from 'vitest';
import { recordSubmitIntent, hasRecentSubmitIntent, clearSubmitIntent, resetSubmitIntents, SUBMIT_INTENT_WINDOW_MS } from './submitIntents';

const ORIGIN = 'https://www.facebook.com';
const T = 1_800_000_000_000;

describe('submitIntents', () => {
  beforeEach(() => {
    resetSubmitIntents();
  });

  it('counts a submit up to three seconds before the request', () => {
    expect(SUBMIT_INTENT_WINDOW_MS).toBe(3000);

    recordSubmitIntent(1, ORIGIN, T);

    expect(hasRecentSubmitIntent(1, ORIGIN, T + 3000)).toBe(true);
    expect(hasRecentSubmitIntent(1, ORIGIN, T + 3001)).toBe(false);
  });

  it('counts a submit reported shortly after the request started (messages race the request)', () => {
    recordSubmitIntent(1, ORIGIN, T + 500);

    expect(hasRecentSubmitIntent(1, ORIGIN, T)).toBe(true);
    expect(hasRecentSubmitIntent(1, ORIGIN, T - 2000)).toBe(false);
  });

  it('does not count a submit of another tab or another origin', () => {
    recordSubmitIntent(1, ORIGIN, T);

    expect(hasRecentSubmitIntent(2, ORIGIN, T)).toBe(false);
    expect(hasRecentSubmitIntent(1, 'https://evil.example', T)).toBe(false);
  });

  it('forgets the submit of a closed tab', () => {
    recordSubmitIntent(1, ORIGIN, T);
    clearSubmitIntent(1);

    expect(hasRecentSubmitIntent(1, ORIGIN, T)).toBe(false);
  });

  it('does not count anything without a tab, an origin or a request time', () => {
    recordSubmitIntent(1, ORIGIN, T);

    expect(hasRecentSubmitIntent(undefined, ORIGIN, T)).toBe(false);
    expect(hasRecentSubmitIntent(1, '', T)).toBe(false);
    expect(hasRecentSubmitIntent(1, ORIGIN, undefined)).toBe(false);
  });
});
