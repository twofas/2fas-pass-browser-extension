// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

const generateLocalKey = vi.fn();
vi.mock('./generateLocalKey.js', () => ({ default: (...args) => generateLocalKey(...args) }));

import getLocalKey from './getLocalKey.js';

describe('getLocalKey — session-scoped transport key (finding #57)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await storage.removeItem('session:lKey');
    await storage.removeItem('local:lKey');
  });

  it('returns the existing session key without regenerating it', async () => {
    await storage.setItem('session:lKey', 'EXISTING_KEY');

    const result = await getLocalKey();

    expect(result).toBe('EXISTING_KEY');
    expect(generateLocalKey).not.toHaveBeenCalled();
  });

  it('generates a new key and stores it in session storage when missing', async () => {
    generateLocalKey.mockResolvedValue('FRESH_KEY');

    const result = await getLocalKey();

    expect(result).toBe('FRESH_KEY');
    expect(generateLocalKey).toHaveBeenCalledTimes(1);
    await expect(storage.getItem('session:lKey')).resolves.toBe('FRESH_KEY');
  });

  it('never reads from or writes to local:lKey on disk', async () => {
    generateLocalKey.mockResolvedValue('FRESH_KEY');

    await getLocalKey();

    await expect(storage.getItem('local:lKey')).resolves.toBeNull();
  });

  it('returns null and does not throw when generation fails', async () => {
    generateLocalKey.mockRejectedValue(new Error('boom'));

    await expect(getLocalKey()).resolves.toBeNull();
    await expect(storage.getItem('session:lKey')).resolves.toBeNull();
  });
});
