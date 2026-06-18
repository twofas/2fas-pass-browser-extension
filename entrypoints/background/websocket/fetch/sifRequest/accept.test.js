// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Finding #29: the autofill recovery payload must carry a SERIALIZABLE key so KeepItem /
// AutofillErrorItem can re-encrypt the pulled SIF after a failed T2 autofill. The session HKDF
// key is non-extractable and the salt is an ArrayBuffer — both serialize to {} through
// JSON.stringify / runtime messaging. Instead the already-derived (extractable) ItemT2 AES key is
// exported to raw Base64 (encryptionItemT2KeyB64) and the non-serializable fields are dropped.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const getItems = vi.fn();
const sendPullRequestCompleted = vi.fn();
const generateEncryptionAESKey = vi.fn();

vi.mock('@/partials/sessionStorage/getItems', () => ({ default: (...args) => getItems(...args) }));
vi.mock('@/partials/sessionStorage/getItemsKeys', () => ({ default: vi.fn() }));
vi.mock('@/partials/sessionStorage/getKey', () => ({ default: vi.fn() }));
vi.mock('../sendPullRequestCompleted', () => ({ default: (...args) => sendPullRequestCompleted(...args) }));
vi.mock('../../utils/generateEncryptionAESKey', () => ({ default: (...args) => generateEncryptionAESKey(...args) }));
vi.mock('../../utils/saveItems', () => ({ default: vi.fn() }));
vi.mock('@/partials/functions', () => ({ generateNonce: vi.fn(), encryptValueForTransmission: vi.fn() }));
vi.mock('@/models/itemModels/Login', () => ({ default: { contentType: 'login' } }));
vi.mock('@/models/itemModels/PaymentCard', () => ({ default: { contentType: 'paymentCard' } }));

import sifRequestAccept from './accept.js';

const HKDF_SALT = new ArrayBuffer(16);
let itemT2Key;

const loginState = () => ({
  from: 'shortcut',
  data: { itemId: 'i1', deviceId: 'd1', vaultId: 'v1', contentType: 'login', cryptoAvailable: false }
});

const cardState = () => ({
  from: 'shortcut',
  data: { itemId: 'i1', deviceId: 'd1', vaultId: 'v1', contentType: 'paymentCard', cryptoAvailable: false }
});

beforeEach(async () => {
  vi.clearAllMocks();
  itemT2Key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  generateEncryptionAESKey.mockResolvedValue(itemT2Key);
  sendPullRequestCompleted.mockResolvedValue(undefined);
});

describe('sifRequestAccept — explicit key export for autofill recovery (finding #29)', () => {
  it('login: result carries encryptionItemT2KeyB64 (the raw exported ItemT2 key) and no non-serializable fields', async () => {
    getItems.mockResolvedValue([{ id: 'i1', content: { username: 'alice' } }]);

    const result = await sifRequestAccept({ data: { s_password: '' } }, loginState(), HKDF_SALT, 'sessionKey', 'msg-1');

    const expectedB64 = ArrayBufferToBase64(await crypto.subtle.exportKey('raw', itemT2Key));

    expect(result.action).toBe('autofill');
    expect(result.encryptionItemT2KeyB64).toBe(expectedB64);
    expect(result.hkdfSaltAB).toBeUndefined();
    expect(result.sessionKeyForHKDF).toBeUndefined();
    expect(result.windowClose).toBe(true);
  });

  it('card: result carries encryptionItemT2KeyB64 and no non-serializable fields', async () => {
    getItems.mockResolvedValue([{ id: 'i1', content: { cardHolder: 'A', cardIssuer: 'visa' } }]);

    const result = await sifRequestAccept({ data: {} }, cardState(), HKDF_SALT, 'sessionKey', 'msg-2');

    const expectedB64 = ArrayBufferToBase64(await crypto.subtle.exportKey('raw', itemT2Key));

    expect(result.action).toBe('autofillCard');
    expect(result.encryptionItemT2KeyB64).toBe(expectedB64);
    expect(result.hkdfSaltAB).toBeUndefined();
    expect(result.sessionKeyForHKDF).toBeUndefined();
  });
});
