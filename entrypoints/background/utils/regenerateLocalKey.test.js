// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

const generateLocalKey = vi.fn();
vi.mock('./generateLocalKey.js', () => ({ default: (...args) => generateLocalKey(...args) }));

import regenerateLocalKey from './regenerateLocalKey.js';

describe('regenerateLocalKey — force-fresh session key on lock/idle (finding #57)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await storage.removeItem('session:lKey');
    await storage.removeItem('local:lKey');
  });

  it('always generates a fresh session key, overwriting any existing one', async () => {
    await storage.setItem('session:lKey', 'STALE_KEY');
    generateLocalKey.mockResolvedValue('REGENERATED_KEY');

    const result = await regenerateLocalKey();

    expect(generateLocalKey).toHaveBeenCalledTimes(1);
    expect(result).toBe('REGENERATED_KEY');
    await expect(storage.getItem('session:lKey')).resolves.toBe('REGENERATED_KEY');
  });

  it('never writes to local:lKey on disk', async () => {
    generateLocalKey.mockResolvedValue('REGENERATED_KEY');

    await regenerateLocalKey();

    await expect(storage.getItem('local:lKey')).resolves.toBeNull();
  });

  it('returns null and does not throw when generation fails', async () => {
    generateLocalKey.mockRejectedValue(new Error('boom'));

    await expect(regenerateLocalKey()).resolves.toBeNull();
  });
});
