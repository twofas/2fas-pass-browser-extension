// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Finding #29: KeepItem recovery must work from the SERIALIZABLE key the autofill flow now
// forwards (encryptionItemT2KeyB64 — raw Base64 of the derived ItemT2 AES key). keepItem must
// import that key directly instead of re-deriving it from a non-serializable HKDF salt/session key
// (which arrive as {} and make generateEncryptionAESKey throw).

import { describe, it, expect, vi, beforeEach } from 'vitest';

const getItems = vi.fn();
const getItemsKeys = vi.fn();
const generateEncryptionAESKey = vi.fn();
const getKey = vi.fn();
const saveItems = vi.fn();
const generateNonce = vi.fn();

vi.mock('@/partials/sessionStorage/getItems', () => ({ default: (...args) => getItems(...args) }));
vi.mock('@/partials/sessionStorage/getItemsKeys', () => ({ default: (...args) => getItemsKeys(...args) }));
vi.mock('@/entrypoints/background/websocket/utils/generateEncryptionAESKey', () => ({ default: (...args) => generateEncryptionAESKey(...args) }));
vi.mock('@/partials/sessionStorage/getKey', () => ({ default: (...args) => getKey(...args) }));
vi.mock('@/entrypoints/background/websocket/utils/saveItems', () => ({ default: (...args) => saveItems(...args) }));
vi.mock('@/partials/functions', () => ({ generateNonce: (...args) => generateNonce(...args) }));

import keepItem from './keepItem.js';

const T2_SESSION_KEY = 'session:item_key_t2-d1-i1';
let keyB64;
let setSifEncrypted;

beforeEach(async () => {
  vi.clearAllMocks();
  await storage.removeItem(T2_SESSION_KEY);

  // The real key the autofill flow exported and forwarded.
  const realKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  keyB64 = ArrayBufferToBase64(await crypto.subtle.exportKey('raw', realKey));

  // A DIFFERENT key, so the obsolete derive-then-export path would store the wrong value.
  const otherKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  generateEncryptionAESKey.mockResolvedValue(otherKey);

  getItemsKeys.mockResolvedValue([]);
  getKey.mockResolvedValue('item_key_t2-d1-i1');
  saveItems.mockResolvedValue(undefined);
  generateNonce.mockResolvedValue({ ArrayBuffer: crypto.getRandomValues(new Uint8Array(12)).buffer });
  vi.spyOn(browser.alarms, 'create').mockResolvedValue(undefined);

  setSifEncrypted = vi.fn();
  getItems.mockResolvedValue([{
    id: 'i1',
    sifs: ['s_password', 's_totp'],
    internalData: {},
    setSifEncrypted
  }]);
});

describe('keepItem — recovery from the forwarded ItemT2 key (finding #29)', () => {
  const state = () => ({
    itemId: 'i1',
    deviceId: 'd1',
    vaultId: 'v1',
    s_password: 'ALREADY_ENCRYPTED_PW',
    encryptionItemT2KeyB64: keyB64
  });

  it('imports the forwarded key instead of re-deriving from HKDF salt/session key', async () => {
    await keepItem(state());

    expect(generateEncryptionAESKey).not.toHaveBeenCalled();
  });

  it('persists exactly the forwarded ItemT2 key to session storage', async () => {
    await keepItem(state());

    expect(await storage.getItem(T2_SESSION_KEY)).toBe(keyB64);
  });

  it('passes through already-encrypted SIF and AES-GCM-encrypts empty SIF with the forwarded key', async () => {
    await keepItem(state());

    const updateArr = setSifEncrypted.mock.calls[0][0];
    const passwordEntry = updateArr.find(e => 's_password' in e);
    const totpEntry = updateArr.find(e => 's_totp' in e);

    expect(passwordEntry.s_password).toBe('ALREADY_ENCRYPTED_PW');

    // The empty SIF must be decryptable back to '' with the forwarded key — proving the import.
    const importedKey = await crypto.subtle.importKey('raw', Base64ToArrayBuffer(keyB64), { name: 'AES-GCM' }, false, ['decrypt']);
    const { iv, data } = DecryptBytes(Base64ToArrayBuffer(totpEntry.s_totp));
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, importedKey, data);

    expect(ArrayBufferToString(decrypted)).toBe('');
  });
});
