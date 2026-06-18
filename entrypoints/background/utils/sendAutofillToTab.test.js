// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMessageToTab = vi.fn();
const sendMessageToAllFrames = vi.fn();
const encryptValueForTransmission = vi.fn();
const resolveCrossDomainPermissions = vi.fn();
const getItem = vi.fn();
const injectCSIfNotAlready = vi.fn();
const handleAutofillWithPermission = vi.fn();
const notificationShow = vi.fn();

vi.mock('@/partials/functions', () => ({
  sendMessageToAllFrames: (...args) => sendMessageToAllFrames(...args),
  sendMessageToTab: (...args) => sendMessageToTab(...args),
  encryptValueForTransmission: (...args) => encryptValueForTransmission(...args),
  resolveCrossDomainPermissions: (...args) => resolveCrossDomainPermissions(...args)
}));

vi.mock('@/partials/sessionStorage/getItem', () => ({
  default: (...args) => getItem(...args)
}));

vi.mock('@/partials/TwofasNotification', () => ({
  default: { show: (...args) => notificationShow(...args) }
}));

vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({
  default: (...args) => injectCSIfNotAlready(...args)
}));

vi.mock('./handleAutofillWithPermission', () => ({
  default: (...args) => handleAutofillWithPermission(...args)
}));

import sendAutofillToTab from './sendAutofillToTab.js';

const PLAINTEXT_PASSWORD = 'plaintext-secret';

const buildItem = () => ({
  sifExists: true,
  securityType: 2,
  content: { username: 'user@example.com' },
  decryptSif: vi.fn(async () => ({ password: PLAINTEXT_PASSWORD }))
});

const getAutofillMessage = () => {
  const call = sendMessageToAllFrames.mock.calls.find(([, message]) => message && 'password' in message);
  return call?.[1];
};

describe('sendAutofillToTab — GET_CRYPTO_AVAILABLE has no response (finding #12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    injectCSIfNotAlready.mockResolvedValue(true);
    getItem.mockResolvedValue(buildItem());
    resolveCrossDomainPermissions.mockResolvedValue({ needsDialog: false, allBlocked: false, crossDomainAllowedDomains: [] });
    sendMessageToAllFrames.mockResolvedValue([{ status: 'ok', canAutofillPassword: true }]);
  });

  it('does not throw when sendMessageToTab returns undefined for GET_CRYPTO_AVAILABLE', async () => {
    sendMessageToTab.mockResolvedValue(undefined);

    await expect(sendAutofillToTab(1, 'device', 'vault', 'item')).resolves.not.toThrow();
  });

  it('treats an undefined crypto response as crypto-unavailable: sends the password as plaintext with cryptoAvailable=false', async () => {
    sendMessageToTab.mockResolvedValue(undefined);

    await sendAutofillToTab(1, 'device', 'vault', 'item');

    const autofillMessage = getAutofillMessage();
    expect(autofillMessage).toBeDefined();
    expect(autofillMessage.cryptoAvailable).toBeFalsy();
    expect(autofillMessage.password).toBe(PLAINTEXT_PASSWORD);
    expect(encryptValueForTransmission).not.toHaveBeenCalled();
  });

  it('does not surface any extra error notification when the crypto response is missing', async () => {
    sendMessageToTab.mockResolvedValue(undefined);

    await sendAutofillToTab(1, 'device', 'vault', 'item');

    expect(notificationShow).not.toHaveBeenCalled();
  });

  it('still encrypts the password when crypto is available', async () => {
    sendMessageToTab.mockResolvedValue({ status: 'ok', cryptoAvailable: true });
    encryptValueForTransmission.mockResolvedValue({ status: 'ok', data: 'encrypted-b64' });

    await sendAutofillToTab(1, 'device', 'vault', 'item');

    const autofillMessage = getAutofillMessage();
    expect(autofillMessage.cryptoAvailable).toBe(true);
    expect(autofillMessage.password).toBe('encrypted-b64');
    expect(encryptValueForTransmission).toHaveBeenCalledWith(PLAINTEXT_PASSWORD);
  });
});

describe('sendAutofillToTab — at-rest password protection on the cross-domain dialog path (finding #5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    injectCSIfNotAlready.mockResolvedValue(true);
    getItem.mockResolvedValue(buildItem());
    handleAutofillWithPermission.mockResolvedValue(undefined);
    sendMessageToAllFrames.mockResolvedValue([{ status: 'ok', canAutofillPassword: true }]);
    resolveCrossDomainPermissions.mockResolvedValue({
      needsDialog: true,
      trustedDomains: [],
      untrustedDomains: [],
      unknownDomains: ['cross.example']
    });
  });

  it('never persists the plaintext password to session storage when the page lacks crypto', async () => {
    sendMessageToTab.mockResolvedValue(undefined); // cryptoAvailable = false
    encryptValueForTransmission.mockResolvedValue({ status: 'ok', data: 'enc-at-rest' });

    await sendAutofillToTab(55, 'device', 'vault', 'item');

    const stored = JSON.parse(await storage.getItem('session:autofillData-55'));
    expect(stored.actionData.password).not.toBe(PLAINTEXT_PASSWORD);
    expect(stored.actionData.password).toBe('enc-at-rest');
    expect(stored.actionData.passwordEncryptedAtRest).toBe(true);
    expect(stored.actionData.cryptoAvailable).toBeFalsy();
    expect(encryptValueForTransmission).toHaveBeenCalledWith(PLAINTEXT_PASSWORD);

    await storage.removeItem('session:autofillData-55');
  });

  it('stores the transport-encrypted password as-is (no second encryption) when crypto is available', async () => {
    sendMessageToTab.mockResolvedValue({ status: 'ok', cryptoAvailable: true });
    encryptValueForTransmission.mockResolvedValue({ status: 'ok', data: 'enc-transport' });

    await sendAutofillToTab(56, 'device', 'vault', 'item');

    const stored = JSON.parse(await storage.getItem('session:autofillData-56'));
    expect(stored.actionData.password).toBe('enc-transport');
    expect(stored.actionData.passwordEncryptedAtRest).toBeFalsy();
    expect(encryptValueForTransmission).toHaveBeenCalledTimes(1);

    await storage.removeItem('session:autofillData-56');
  });
});
