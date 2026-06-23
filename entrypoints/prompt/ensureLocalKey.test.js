// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ensureLocalKey from './ensureLocalKey';

describe('ensureLocalKey', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', { subtle: { importKey: vi.fn().mockResolvedValue('imported-key') } });
    browser.runtime.sendMessage = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches, imports and caches the key when none is present', async () => {
    browser.runtime.sendMessage.mockResolvedValue({ status: 'ok', data: 'dGVzdGtleWRhdGE=' });
    const localKey = { data: null };

    await ensureLocalKey(localKey);

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ action: REQUEST_ACTIONS.GET_LOCAL_KEY }));
    expect(crypto.subtle.importKey).toHaveBeenCalledTimes(1);
    expect(localKey.data).toBe('imported-key');
  });

  it('does nothing (no fetch) when a key is already cached', async () => {
    const localKey = { data: 'existing-key' };

    await ensureLocalKey(localKey);

    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
    expect(localKey.data).toBe('existing-key');
  });

  it('leaves the key null without throwing when the background fetch fails', async () => {
    browser.runtime.sendMessage.mockRejectedValue(new Error('worker unavailable'));
    const localKey = { data: null };

    await expect(ensureLocalKey(localKey)).resolves.toBeUndefined();
    expect(crypto.subtle.importKey).not.toHaveBeenCalled();
    expect(localKey.data).toBeNull();
  });

  it('leaves the key null without throwing when the background returns no key', async () => {
    browser.runtime.sendMessage.mockResolvedValue({ status: 'error' });
    const localKey = { data: null };

    await ensureLocalKey(localKey);

    expect(crypto.subtle.importKey).not.toHaveBeenCalled();
    expect(localKey.data).toBeNull();
  });
});
