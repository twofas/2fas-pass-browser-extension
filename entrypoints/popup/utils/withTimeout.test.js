// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import withTimeout from './withTimeout.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('withTimeout', () => {
  it('resolves with the value when the promise settles in time', async () => {
    const result = withTimeout(Promise.resolve('ok'), 1000);

    await expect(result).resolves.toEqual({ timedOut: false, value: 'ok' });
  });

  it('resolves as timed out when the promise never settles', async () => {
    const result = withTimeout(new Promise(() => {}), 1000);

    await vi.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toEqual({ timedOut: true, value: undefined });
  });

  it('does not resolve before the timeout', async () => {
    const onSettled = vi.fn();
    withTimeout(new Promise(() => {}), 1000).then(onSettled);

    await vi.advanceTimersByTimeAsync(999);

    expect(onSettled).not.toHaveBeenCalled();
  });

  it('propagates a rejection that happens in time', async () => {
    const result = withTimeout(Promise.reject(new Error('boom')), 1000);

    await expect(result).rejects.toThrow('boom');
  });

  it('clears its timer after the promise settles', async () => {
    await withTimeout(Promise.resolve('ok'), 1000);

    expect(vi.getTimerCount()).toBe(0);
  });
});
