// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// The ignore lists keep analytics, ads and telemetry requests away from the save prompt. They must not reject a login
// or sign-up because a query parameter or a field value happens to contain one of their words.

import { describe, it, expect } from 'vitest';
import { isIgnoredSavePromptUrl, hasIgnoredSavePromptBodyField } from './savePromptIgnoreRules';

const bytes = text => new TextEncoder().encode(text).buffer;
const rawBody = text => ({ requestBody: { raw: [{ bytes: bytes(text) }] } });

describe('isIgnoredSavePromptUrl', () => {
  it('ignores analytics and telemetry hosts and paths', () => {
    expect(isIgnoredSavePromptUrl('https://www.google-analytics.com/g/collect')).toBe(true);
    expect(isIgnoredSavePromptUrl('https://o1.ingest.sentry.io/api/1/envelope/')).toBe(true);
    expect(isIgnoredSavePromptUrl('https://www.facebook.com/tr/')).toBe(true);
    expect(isIgnoredSavePromptUrl('https://shop.example.com/search?q=shoes')).toBe(true);
  });

  it('does not ignore a login whose query string contains a listed word', () => {
    expect(isIgnoredSavePromptUrl('https://example.com/api/login?captchaToken=abc')).toBe(false);
    expect(isIgnoredSavePromptUrl('https://example.com/signup?utm_source=analytics&cookie=1')).toBe(false);
  });
});

describe('hasIgnoredSavePromptBodyField', () => {
  it('finds a listed field name in JSON, nested JSON, urlencoded and form data bodies', () => {
    expect(hasIgnoredSavePromptBodyField(rawBody('{"totalJSHeapSize":1,"usedJSHeapSize":2}'))).toBe(true);
    expect(hasIgnoredSavePromptBodyField(rawBody('{"imp":[{"banner":{"w":300}}]}'))).toBe(true);
    expect(hasIgnoredSavePromptBodyField(rawBody('visitorId=1&page=home'))).toBe(true);
    expect(hasIgnoredSavePromptBodyField({ requestBody: { formData: { widget: ['x'] } } })).toBe(true);
  });

  it('does not match a listed word inside a value or a longer field name', () => {
    expect(hasIgnoredSavePromptBodyField(rawBody('{"username":"banner-fan","password":"widget123"}'))).toBe(false);
    expect(hasIgnoredSavePromptBodyField(rawBody('{"bannerDismissed":true}'))).toBe(false);
  });

  it('returns false for an empty or binary body', () => {
    expect(hasIgnoredSavePromptBodyField({})).toBe(false);
    expect(hasIgnoredSavePromptBodyField({ requestBody: { raw: [{ file: '/tmp/a' }] } })).toBe(false);
  });
});
