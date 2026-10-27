// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// The background rotates the local key on every lock, while this page keeps the key it fetched. Each encrypted
// value carries the id of its key; when the background answers staleKey, the page fetches the current key and
// sends the value again, so a login after unlocking still reaches the save prompt.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('@/partials/functions/isVisible', () => ({ default: () => true }));

import handleInputEvent from './handleInputEvent';
import encryptFlushData from './encryptFlushData';
import ensureLocalKey, { refreshLocalKey, waitForLocalKeyRefresh } from './ensureLocalKey';
import createLocalKeyFreshnessCheck from './createLocalKeyFreshnessCheck';
import sendPromptInputs from './sendPromptInputs';

const KEY_OLD = 'q83vEjRWeJCrze8SNFZ4kKvN7xI0VniQq83vEjRWeJA=';
const KEY_NEW = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=';

/**
* Imports a base64 AES-GCM key the way the prompt content script does.
* @param {string} keyB64 - The base64 key.
* @return {Promise<CryptoKey>} The imported key.
*/
const importKey = keyB64 => crypto.subtle.importKey('raw', Base64ToArrayBuffer(keyB64), { name: 'AES-GCM' }, false, ['encrypt']);

/**
* Builds a sendMessage mock: the background accepts only values of keyId 'new' and serves the new key.
* @return {Function} The mock.
*/
const backgroundMock = () => vi.fn(async message => {
  if (message.action === REQUEST_ACTIONS.GET_LOCAL_KEY) {
    return { status: 'ok', data: KEY_NEW, keyId: 'new' };
  }

  const entries = Array.isArray(message.data) ? message.data : [message.data];

  return entries.some(entry => entry?.encrypted && entry.keyId !== 'new') ? { status: 'error', message: 'staleKey' } : { status: 'ok' };
});

/**
* Returns the encrypted inputs the background accepted.
* @return {Object[]} The accepted input data.
*/
const acceptedInputs = () => browser.runtime.sendMessage.mock.calls
  .map(([message]) => message)
  .filter(message => message.action === REQUEST_ACTIONS.PROMPT_INPUT)
  .map(message => message.data)
  .filter(data => data.keyId === 'new');

describe('save prompt capture — local key rotated by a lock', () => {
  beforeEach(() => {
    browser.runtime.sendMessage = backgroundMock();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('ensureLocalKey keeps the key id served with the key', async () => {
    const localKey = { data: null };

    await ensureLocalKey(localKey);

    expect(localKey.data).toBeTruthy();
    expect(localKey.keyId).toBe('new');
  });

  it('refreshLocalKey replaces a cached key', async () => {
    const localKey = { data: await importKey(KEY_OLD), keyId: 'old' };

    await refreshLocalKey(localKey);

    expect(localKey.keyId).toBe('new');
  });

  it('refreshLocalKey keeps the old key usable until the new one is imported', async () => {
    const oldKey = await importKey(KEY_OLD);
    const localKey = { data: oldKey, keyId: 'old' };
    let seenDuringFetch;
    browser.runtime.sendMessage = vi.fn(async () => {
      seenDuringFetch = localKey.data;
      return { status: 'ok', data: KEY_NEW, keyId: 'new' };
    });

    await refreshLocalKey(localKey);

    expect(seenDuringFetch).toBe(oldKey);
    expect(localKey.keyId).toBe('new');
  });

  it('refreshLocalKey shares one fetch between concurrent refreshes', async () => {
    const localKey = { data: await importKey(KEY_OLD), keyId: 'old' };

    await Promise.all([refreshLocalKey(localKey), refreshLocalKey(localKey)]);

    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(localKey.keyId).toBe('new');
  });

  it('handleInputEvent refreshes the cached key in plaintext mode when the background reports another key id', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<form><input id="password" type="password" twofas-pass-id="p2"></form>';
    const input = document.getElementById('password');
    const localKey = { data: await importKey(KEY_OLD), keyId: 'old' };
    browser.runtime.sendMessage = vi.fn(async message => (message.action === REQUEST_ACTIONS.GET_LOCAL_KEY
      ? { status: 'ok', data: KEY_NEW, keyId: 'new' }
      : { status: 'ok', keyId: 'new' }));
    input.value = 'S3cret';

    await handleInputEvent({ target: input }, [input], localKey, {}, { value: false }, false, {}, {});
    await vi.advanceTimersByTimeAsync(500);

    await vi.waitFor(() => expect(localKey.keyId).toBe('new'));
  });

  it('waitForLocalKeyRefresh resolves once a running refresh has replaced the key', async () => {
    const localKey = { data: await importKey(KEY_OLD), keyId: 'old' };

    refreshLocalKey(localKey);
    await waitForLocalKeyRefresh(localKey);

    expect(localKey.keyId).toBe('new');
  });

  it('sendPromptInputs encrypts with the key of a refresh started just before it (submit click after idle)', async () => {
    const localKey = { data: await importKey(KEY_OLD), keyId: 'old' };

    refreshLocalKey(localKey);
    await sendPromptInputs([{ id: 'p', type: 'password', value: 'S3cret', encrypted: false }], localKey, true);

    const inputCalls = browser.runtime.sendMessage.mock.calls.filter(([message]) => message.action === REQUEST_ACTIONS.PROMPT_INPUT);
    expect(inputCalls.map(([message]) => message.data.keyId)).toEqual(['new']);
  });

  it('the freshness check refreshes the key on interaction only after the page was idle', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const localKey = { data: await importKey(KEY_OLD), keyId: 'old' };
    const checkKey = createLocalKeyFreshnessCheck(localKey, 30000);

    now.mockReturnValue(1_020_000);
    checkKey();
    await waitForLocalKeyRefresh(localKey);
    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();

    now.mockReturnValue(1_051_000);
    checkKey();
    await waitForLocalKeyRefresh(localKey);
    expect(localKey.keyId).toBe('new');

    checkKey();
    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    now.mockRestore();
  });

  it('encryptFlushData marks encrypted entries with the key id', async () => {
    const localKey = { data: await importKey(KEY_NEW), keyId: 'new' };
    const [entry] = await encryptFlushData([{ id: 'p', type: 'password', value: 'S3cret', encrypted: false }], localKey, true);

    expect(entry.encrypted).toBe(true);
    expect(entry.keyId).toBe('new');
  });

  it('sendPromptInputs resends the flush with the current key after staleKey', async () => {
    const localKey = { data: await importKey(KEY_OLD), keyId: 'old' };

    await sendPromptInputs([{ id: 'p', type: 'password', value: 'S3cret', encrypted: false }], localKey, true);

    expect(acceptedInputs().map(data => data.id)).toEqual(['p']);
  });

  it('handleInputEvent resends a typed value with the current key after staleKey', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<form><input id="password" type="password" twofas-pass-id="p1"></form>';
    const input = document.getElementById('password');
    const localKey = { data: await importKey(KEY_OLD), keyId: 'old' };
    input.value = 'S3cret';

    await handleInputEvent({ target: input }, [input], localKey, {}, { value: false }, true, {}, {});
    await vi.advanceTimersByTimeAsync(500);

    await vi.waitFor(() => expect(acceptedInputs().map(data => data.id)).toEqual(['p1']));
  });
});
