// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach } from 'vitest';

import migration from './1.js';

describe('migration 1 — removes legacy local:allLoginsSort', () => {
  beforeEach(async () => {
    await browser.storage.local.clear();
  });

  it('removes local:allLoginsSort when present', async () => {
    await storage.setItem('local:allLoginsSort', 'name-asc');

    await migration();

    await expect(storage.getItem('local:allLoginsSort')).resolves.toBeNull();
  });

  it('leaves other keys untouched while removing the legacy key', async () => {
    await storage.setItem('local:allLoginsSort', 'name-asc');
    await storage.setItem('local:theme', 'dark');

    await migration();

    await expect(storage.getItem('local:allLoginsSort')).resolves.toBeNull();
    await expect(storage.getItem('local:theme')).resolves.toBe('dark');
  });

  it('is a no-op when local:allLoginsSort is absent', async () => {
    await expect(migration()).resolves.not.toThrow();
    await expect(storage.getItem('local:allLoginsSort')).resolves.toBeNull();
  });
});
