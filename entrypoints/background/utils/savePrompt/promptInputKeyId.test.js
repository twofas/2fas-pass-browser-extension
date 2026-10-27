// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// The local key rotates on every lock (regenerateLocalKey), while a page keeps the key it fetched. Values the page
// encrypts with an old key can never be decrypted, so every encrypted entry carries the id of its key and the
// background refuses entries of an old key.

import { describe, it, expect } from 'vitest';
import getLocalKeyId from '../getLocalKeyId';
import { isStalePromptInput, dropStalePromptInputs } from './promptInputKeyId';

const KEY_A = 'q83vEjRWeJCrze8SNFZ4kKvN7xI0VniQq83vEjRWeJA=';
const KEY_B = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=';

describe('getLocalKeyId', () => {
  it('is stable for a key, differs between keys and does not contain the key', async () => {
    const idA = await getLocalKeyId(KEY_A);

    expect(idA).toBe(await getLocalKeyId(KEY_A));
    expect(idA).not.toBe(await getLocalKeyId(KEY_B));
    expect(idA.length).toBeGreaterThan(8);
    expect(KEY_A.includes(idA)).toBe(false);
  });

  it('returns null without a key', async () => {
    expect(await getLocalKeyId(null)).toBeNull();
  });
});

describe('isStalePromptInput', () => {
  it('flags an encrypted entry of another key or without a key id', () => {
    expect(isStalePromptInput({ encrypted: true, keyId: 'old' }, 'new')).toBe(true);
    expect(isStalePromptInput({ encrypted: true }, 'new')).toBe(true);
  });

  it('accepts an encrypted entry of the current key and any plaintext entry', () => {
    expect(isStalePromptInput({ encrypted: true, keyId: 'new' }, 'new')).toBe(false);
    expect(isStalePromptInput({ encrypted: false, value: 'x' }, 'new')).toBe(false);
  });
});

describe('dropStalePromptInputs', () => {
  it('removes the entries of an old key from the tab and keeps the others', () => {
    const tabsInputData = {
      7: {
        a: { id: 'a', encrypted: true, keyId: 'old' },
        b: { id: 'b', encrypted: true, keyId: 'new' },
        c: { id: 'c', encrypted: false, value: 'x' }
      }
    };

    dropStalePromptInputs(tabsInputData, 7, 'new');

    expect(Object.keys(tabsInputData[7])).toEqual(['b', 'c']);
  });
});
