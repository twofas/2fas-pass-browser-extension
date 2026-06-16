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
