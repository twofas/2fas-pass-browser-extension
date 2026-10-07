// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Spec: every item sent to the phone (addData and updateData, from the add and edit views, the share
// import and the save prompt) has the whitespace around its values trimmed, secrets included.
// The test decrypts the sent payload with the (stubbed) keys to read what the phone receives.

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { PULL_REQUEST_TYPES } from '@/constants';

const sendMessageMock = vi.fn();
const getItemMock = vi.fn();
let aesKey;

vi.mock('./index.js', () => ({ default: { getInstance: () => ({ sendMessage: (...args) => sendMessageMock(...args) }) } }));
vi.mock('./utils/generateEncryptionAESKey', () => ({ default: async () => aesKey }));
vi.mock('@/partials/sessionStorage/getItem', () => ({ default: (...args) => getItemMock(...args) }));

import handlePullRequest from './handlePullRequest';

const encrypt = async text => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, StringToArrayBuffer(text));

  return ArrayBufferToBase64(EncryptBytes(iv.buffer, encrypted));
};

const decrypt = async valueB64 => {
  const bytes = DecryptBytes(Base64ToArrayBuffer(valueB64));
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.iv }, aesKey, bytes.data);

  return ArrayBufferToString(decrypted);
};

const sendPullRequest = async state => {
  const json = { id: 'message-1', payload: { newSessionIdEnc: await encrypt('session') } };

  await handlePullRequest(json, new ArrayBuffer(8), null, state);

  const [message] = sendMessageMock.mock.calls.at(-1);

  return JSON.parse(await decrypt(message.payload.dataEnc));
};

describe('handlePullRequest trimmed item values', () => {
  beforeAll(async () => {
    aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  });

  beforeEach(() => {
    sendMessageMock.mockReset();
    getItemMock.mockReset();
  });

  it('trims the values of a new login but never its password', async () => {
    const sent = await sendPullRequest({
      action: PULL_REQUEST_TYPES.ADD_DATA,
      data: {
        contentType: 'login',
        content: {
          name: ' GitHub ',
          uris: [{ text: ' https://github.com ', matcher: 0 }],
          username: { value: ' me@2fas.com ', action: 'set' },
          s_password: { value: ' secret\n', action: 'set' },
          notes: ' note '
        }
      }
    });

    expect(sent.type).toBe(PULL_REQUEST_TYPES.ADD_DATA);
    expect(sent.data.content.name).toBe('GitHub');
    expect(sent.data.content.uris).toEqual([{ text: 'https://github.com', matcher: 0 }]);
    expect(sent.data.content.username).toEqual({ value: 'me@2fas.com', action: 'set' });
    expect(sent.data.content.notes).toBe('note');
    expect(await decrypt(sent.data.content.s_password.value)).toBe(' secret\n');
  });

  it('trims the values of a new login from the save prompt but never its password', async () => {
    const sent = await sendPullRequest({
      action: PULL_REQUEST_TYPES.ADD_DATA,
      data: {
        contentType: 'login',
        content: {
          url: 'https://github.com/login ',
          username: { value: 'me@2fas.com ', action: 'set' },
          s_password: { value: ' secret', action: 'set' }
        }
      }
    });

    expect(sent.data.content.url).toBe('https://github.com/login');
    expect(sent.data.content.username.value).toBe('me@2fas.com');
    expect(await decrypt(sent.data.content.s_password.value)).toBe(' secret');
  });

  it('trims the values and the secrets of a new payment card, Secure Note and Wi-Fi network, never the Wi-Fi password', async () => {
    const card = await sendPullRequest({
      action: PULL_REQUEST_TYPES.ADD_DATA,
      data: {
        contentType: 'paymentCard',
        content: { name: ' Card ', cardHolder: ' John Doe ', s_cardNumber: '4111111111111111', s_expirationDate: ' 12/30', s_securityCode: '123 ', notes: ' n ' }
      }
    });

    expect(card.data.content.name).toBe('Card');
    expect(card.data.content.cardHolder).toBe('John Doe');
    expect(card.data.content.notes).toBe('n');
    expect(await decrypt(card.data.content.s_expirationDate)).toBe('12/30');
    expect(await decrypt(card.data.content.s_securityCode)).toBe('123');

    const note = await sendPullRequest({
      action: PULL_REQUEST_TYPES.ADD_DATA,
      data: { contentType: 'secureNote', content: { name: ' Note ', s_text: '\n text \n' } }
    });

    expect(note.data.content.name).toBe('Note');
    expect(await decrypt(note.data.content.s_text)).toBe('\n text \n');

    const wifi = await sendPullRequest({
      action: PULL_REQUEST_TYPES.ADD_DATA,
      data: { contentType: 'wifi', content: { name: ' Home ', ssid: ' net ', s_wifi_password: ' pass ', securityType: 'wpa2', hidden: false } }
    });

    expect(wifi.data.content.name).toBe('Home');
    expect(wifi.data.content.ssid).toBe('net');
    expect(await decrypt(wifi.data.content.s_wifi_password)).toBe(' pass ');
  });

  it('trims the changed values of an updated item, the secrets included, never the password', async () => {
    getItemMock.mockResolvedValue({ securityType: SECURITY_TIER.SECRET });

    const login = await sendPullRequest({
      action: PULL_REQUEST_TYPES.UPDATE_DATA,
      data: {
        contentType: 'login',
        deviceId: 'device-1',
        vaultId: 'vault-1',
        itemId: 'item-1',
        content: { name: ' GitHub ', s_password: { value: ' new ', action: 'set' } }
      }
    });

    expect(login.type).toBe(PULL_REQUEST_TYPES.UPDATE_DATA);
    expect(login.data.deviceId).toBeUndefined();
    expect(login.data.content.name).toBe('GitHub');
    expect(await decrypt(login.data.content.s_password.value)).toBe(' new ');

    const wifi = await sendPullRequest({
      action: PULL_REQUEST_TYPES.UPDATE_DATA,
      data: { contentType: 'wifi', deviceId: 'device-1', vaultId: 'vault-1', itemId: 'item-2', content: { ssid: ' net ' } }
    });

    expect(wifi.data.content).toEqual({ ssid: 'net' });

    const note = await sendPullRequest({
      action: PULL_REQUEST_TYPES.UPDATE_DATA,
      data: { contentType: 'secureNote', deviceId: 'device-1', vaultId: 'vault-1', itemId: 'item-3', content: { s_text: ' text\n', additionalInfo: ' info ' } }
    });

    expect(note.data.content.additionalInfo).toBe('info');
    expect(await decrypt(note.data.content.s_text)).toBe('text\n');

    const card = await sendPullRequest({
      action: PULL_REQUEST_TYPES.UPDATE_DATA,
      data: { contentType: 'paymentCard', deviceId: 'device-1', vaultId: 'vault-1', itemId: 'item-4', content: { cardHolder: ' Jane ', s_expirationDate: '01/31 ', s_securityCode: ' 4321' } }
    });

    expect(card.data.content.cardHolder).toBe('Jane');
    expect(await decrypt(card.data.content.s_expirationDate)).toBe('01/31');
    expect(await decrypt(card.data.content.s_securityCode)).toBe('4321');
  });

  it('sends the values that are not texts as they are', async () => {
    const login = await sendPullRequest({
      action: PULL_REQUEST_TYPES.ADD_DATA,
      data: {
        contentType: 'login',
        content: {
          name: 'GitHub',
          username: { value: '', action: 'generate' },
          passwordMinLength: 8,
          passwordMaxLength: null,
          uris: []
        }
      }
    });

    expect(login.data.content).toEqual({
      name: 'GitHub',
      username: { value: '', action: 'generate' },
      passwordMinLength: 8,
      passwordMaxLength: null,
      uris: []
    });

    const wifi = await sendPullRequest({
      action: PULL_REQUEST_TYPES.UPDATE_DATA,
      data: { contentType: 'wifi', deviceId: 'device-1', vaultId: 'vault-1', itemId: 'item-2', content: { hidden: true, securityType: 'wpa3' }, securityType: 1, tags: ['tag-1'] }
    });

    expect(wifi.data).toEqual({ contentType: 'wifi', vaultId: 'vault-1', itemId: 'item-2', content: { hidden: true, securityType: 'wpa3' }, securityType: 1, tags: ['tag-1'] });
  });
});
