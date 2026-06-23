// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach } from 'vitest';

import migration from './3.js';

describe('migration 3 — removes the on-disk local:lKey (finding #57)', () => {
  beforeEach(async () => {
    await storage.removeItem('local:lKey');
  });

  it('removes local:lKey when present on disk', async () => {
    await storage.setItem('local:lKey', 'OLD_DISK_KEY');

    await migration();

    await expect(storage.getItem('local:lKey')).resolves.toBeNull();
  });

  it('is a no-op when local:lKey is absent', async () => {
    await expect(migration()).resolves.not.toThrow();
    await expect(storage.getItem('local:lKey')).resolves.toBeNull();
  });
});
