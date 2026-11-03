// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import waitForMatchingCredentials from './waitForMatchingCredentials';

describe('waitForMatchingCredentials', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the first matching values without waiting', async () => {
    const read = vi.fn(async () => ({ password: 'p' }));

    await expect(waitForMatchingCredentials(read)).resolves.toEqual({ password: 'p' });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('reads again until the values match', async () => {
    const read = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValue({ password: 'p' });
    const promise = waitForMatchingCredentials(read, { maxWait: 600, step: 50 });

    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toEqual({ password: 'p' });
    expect(read).toHaveBeenCalledTimes(3);
  });

  it('returns null when the values never match', async () => {
    const promise = waitForMatchingCredentials(async () => null, { maxWait: 200, step: 50 });

    await vi.advanceTimersByTimeAsync(250);

    await expect(promise).resolves.toBeNull();
  });
});
