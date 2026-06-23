// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach } from 'vitest';

import migration from './2.js';

describe('migration 2 — sets the default language', () => {
  beforeEach(async () => {
    await browser.storage.local.clear();
  });

  it('sets local:lang to "default" when it is missing', async () => {
    await migration();

    await expect(storage.getItem('local:lang')).resolves.toBe('default');
  });

  it('resets local:lang to "default" when the stored value is not a supported language', async () => {
    await storage.setItem('local:lang', 'fr');

    await migration();

    await expect(storage.getItem('local:lang')).resolves.toBe('default');
  });

  it.each(['default', 'en', 'pl', 'de'])('keeps the supported language "%s" unchanged', async lang => {
    await storage.setItem('local:lang', lang);

    await migration();

    await expect(storage.getItem('local:lang')).resolves.toBe(lang);
  });
});
