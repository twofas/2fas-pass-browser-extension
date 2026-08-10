// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const generateEncryptionAESKey = vi.fn();
const addFcmTokenToDevice = vi.fn();
const addExpirationDateToDevice = vi.fn();
const sendMessage = vi.fn();
const CatchErrorMock = vi.fn();

vi.mock('@/utils/CatchError.js', () => ({ default: (...args) => CatchErrorMock(...args) }));
vi.mock('./utils/generateEncryptionAESKey', () => ({ default: (...args) => generateEncryptionAESKey(...args) }));
vi.mock('./utils/addFcmTokenToDevice', () => ({ default: (...args) => addFcmTokenToDevice(...args) }));
vi.mock('./utils/addExpirationDateToDevice', () => ({ default: (...args) => addExpirationDateToDevice(...args) }));
vi.mock('./utils/checkStorageSessionCapacity', () => ({ default: vi.fn() }));
vi.mock('./utils/checkChecksumLength', () => ({ default: vi.fn() }));
vi.mock('.', () => ({ default: { getInstance: () => ({ sendMessage: (...args) => sendMessage(...args) }) } }));

import handleInitTransfer from './handleInitTransfer.js';

const UUID = 'uuid-1';
const DEVICE_ID = 'device-1';
const HKDF_SALT = new ArrayBuffer(16);

let dataKey;

const encryptToB64 = async text => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dataKey, StringToArrayBuffer(text));
  return ArrayBufferToBase64(EncryptBytes(iv.buffer, ciphertext));
};

const buildJson = async payload => ({
  id: 'msg-1',
  payload: {
    totalChunks: 1,
    totalSize: 100,
    sha256GzipVaultDataEnc: 'checksum',
    newSessionIdEnc: await encryptToB64('new-session-id'),
    ...payload
  }
});

beforeEach(async () => {
  vi.clearAllMocks();
  dataKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  generateEncryptionAESKey.mockResolvedValue(dataKey);
  addExpirationDateToDevice.mockResolvedValue(undefined);
  sendMessage.mockResolvedValue(undefined);
});

describe('handleInitTransfer — expirationDateEnc decryption failure must not silently downgrade a paid device', () => {
  it('throws decryptExpirationDate (2211) instead of swallowing the error', async () => {
    const json = await buildJson({ expirationDateEnc: ArrayBufferToBase64(new Uint8Array(32).buffer) });

    await expect(handleInitTransfer(json, HKDF_SALT, 'sessionKey', UUID, DEVICE_ID)).rejects.toMatchObject({
      code: TwoFasError.errors.decryptExpirationDate.code
    });
  });

  it('never writes null over a previously stored expiration date when decryption fails', async () => {
    const json = await buildJson({ expirationDateEnc: ArrayBufferToBase64(new Uint8Array(32).buffer) });

    await expect(handleInitTransfer(json, HKDF_SALT, 'sessionKey', UUID, DEVICE_ID)).rejects.toBeDefined();
    expect(addExpirationDateToDevice).not.toHaveBeenCalled();
  });
});

describe('handleInitTransfer — expirationDateEnc storage failure must not abort pairing', () => {
  it('completes INIT_TRANSFER when addExpirationDateToDevice throws deviceNotFound', async () => {
    addExpirationDateToDevice.mockRejectedValue(new TwoFasError(TwoFasError.internalErrors.deviceNotFound));
    const json = await buildJson({ expirationDateEnc: await encryptToB64('1900000000000') });

    const res = await handleInitTransfer(json, HKDF_SALT, 'sessionKey', UUID, DEVICE_ID);

    expect(res.totalChunks).toBe(1);
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ action: SOCKET_ACTIONS.INIT_TRANSFER_CONFIRMED }));
    expect(CatchErrorMock).toHaveBeenCalled();
  });
});

describe('handleInitTransfer — device lookup uses both identifiers', () => {
  it('passes uuid and deviceId to addExpirationDateToDevice', async () => {
    const json = await buildJson({ expirationDateEnc: await encryptToB64('1900000000000') });

    await handleInitTransfer(json, HKDF_SALT, 'sessionKey', UUID, DEVICE_ID);

    expect(addExpirationDateToDevice).toHaveBeenCalledWith(
      { uuid: UUID, deviceId: DEVICE_ID },
      ArrayBufferToBase64(StringToArrayBuffer('1900000000000'))
    );
  });

  it('stores null when the mobile app reports no subscription (field absent)', async () => {
    const json = await buildJson({});

    await handleInitTransfer(json, HKDF_SALT, 'sessionKey', UUID, DEVICE_ID);

    expect(addExpirationDateToDevice).toHaveBeenCalledWith({ uuid: UUID, deviceId: DEVICE_ID }, null);
  });
});
