// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const generateEncryptionAESKey = vi.fn();
const addExpirationDateToDevice = vi.fn();
const sendMessage = vi.fn();
const CatchErrorMock = vi.fn();

vi.mock('@/utils/CatchError.js', () => ({ default: (...args) => CatchErrorMock(...args) }));
vi.mock('../../utils/generateEncryptionAESKey', () => ({ default: (...args) => generateEncryptionAESKey(...args) }));
vi.mock('../../utils/addExpirationDateToDevice', () => ({ default: (...args) => addExpirationDateToDevice(...args) }));
vi.mock('../../utils/checkStorageSessionCapacity', () => ({ default: vi.fn() }));
vi.mock('../../utils/checkChecksumLength', () => ({ default: vi.fn() }));
vi.mock('../..', () => ({ default: { getInstance: () => ({ sendMessage: (...args) => sendMessage(...args) }) } }));

import fullSyncAccept from './accept.js';

const HKDF_SALT = new ArrayBuffer(16);
const UUID = 'uuid-1';
const DEVICE_ID = 'device-1';

let dataKey;

const encryptToB64 = async text => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dataKey, StringToArrayBuffer(text));
  return ArrayBufferToBase64(EncryptBytes(iv.buffer, ciphertext));
};

const buildData = extra => ({ totalChunks: 2, totalSize: 200, sha256GzipVaultDataEnc: 'checksum', ...extra });
const buildState = () => ({ uuid: UUID, deviceId: DEVICE_ID });

beforeEach(async () => {
  vi.clearAllMocks();
  dataKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  generateEncryptionAESKey.mockResolvedValue(dataKey);
  addExpirationDateToDevice.mockResolvedValue(undefined);
  sendMessage.mockResolvedValue(undefined);
});

describe('fullSyncAccept — subscription expiration date arriving over fullSync', () => {
  it('decrypts expirationDateEnc and stores it for the synced device', async () => {
    const data = buildData({ expirationDateEnc: await encryptToB64('1900000000000') });

    await fullSyncAccept(data, buildState(), HKDF_SALT, 'sessionKey', 'msg-1');

    expect(addExpirationDateToDevice).toHaveBeenCalledWith(
      { uuid: UUID, deviceId: DEVICE_ID },
      ArrayBufferToBase64(StringToArrayBuffer('1900000000000'))
    );
  });

  it('leaves the stored expiration date untouched when the field is absent', async () => {
    await fullSyncAccept(buildData(), buildState(), HKDF_SALT, 'sessionKey', 'msg-2');

    expect(addExpirationDateToDevice).not.toHaveBeenCalled();
  });

  it('throws decryptExpirationDate (2211) when the field is present but undecryptable', async () => {
    const data = buildData({ expirationDateEnc: ArrayBufferToBase64(new Uint8Array(32).buffer) });

    await expect(fullSyncAccept(data, buildState(), HKDF_SALT, 'sessionKey', 'msg-3')).rejects.toMatchObject({
      code: TwoFasError.errors.decryptExpirationDate.code
    });
    expect(addExpirationDateToDevice).not.toHaveBeenCalled();
  });

  it('completes the sync when storing the expiration date fails', async () => {
    addExpirationDateToDevice.mockRejectedValue(new TwoFasError(TwoFasError.internalErrors.deviceNotFound));
    const data = buildData({ expirationDateEnc: await encryptToB64('1900000000000') });
    const state = buildState();

    await fullSyncAccept(data, state, HKDF_SALT, 'sessionKey', 'msg-4');

    expect(state.totalChunks).toBe(2);
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ action: SOCKET_ACTIONS.INIT_TRANSFER_CONFIRMED }));
    expect(CatchErrorMock).toHaveBeenCalled();
  });
});

describe('fullSyncAccept — transfer state is still set up', () => {
  it('keeps populating the chunk transfer state', async () => {
    const state = buildState();

    await fullSyncAccept(buildData(), state, HKDF_SALT, 'sessionKey', 'msg-5');

    expect(state.sha256GzipVaultDataEnc).toBe('checksum');
    expect(state.totalChunks).toBe(2);
    expect(state.encryptionDataKeyAES).toBe(dataKey);
    expect(state.chunks).toEqual([]);
  });
});
