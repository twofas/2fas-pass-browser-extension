// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMessageToAllFrames = vi.fn();
const sendMessageToTab = vi.fn();
const loadAndClassifyCrossDomainPermissions = vi.fn();
const injectCSIfNotAlready = vi.fn();
const notificationShow = vi.fn();
const openPopupWithFallback = vi.fn();
const restoreActionDataPassword = vi.fn();
const focusTabForDialog = vi.fn();

vi.mock('@/partials/functions', async () => ({
  sendMessageToAllFrames: (...args) => sendMessageToAllFrames(...args),
  sendMessageToTab: (...args) => sendMessageToTab(...args),
  loadAndClassifyCrossDomainPermissions: (...args) => loadAndClassifyCrossDomainPermissions(...args),
  focusTabForDialog: (...args) => focusTabForDialog(...args),
  aggregateLoginAutofillResponses: (await vi.importActual('@/partials/functions/aggregateLoginAutofillResponses')).default
}));

vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({
  default: (...args) => injectCSIfNotAlready(...args)
}));

vi.mock('@/partials/TwofasNotification', () => ({
  default: { show: (...args) => notificationShow(...args) }
}));

vi.mock('./openPopupWithFallback', () => ({
  default: (...args) => openPopupWithFallback(...args)
}));

vi.mock('./restoreActionDataPassword', () => ({
  default: (...args) => restoreActionDataPassword(...args)
}));

import handleAutofillWithPermission from './handleAutofillWithPermission.js';

const KEY = 'session:autofillData-9';

const findFillCall = () => sendMessageToAllFrames.mock.calls.find(([, message]) => message && 'password' in message);

beforeEach(async () => {
  vi.clearAllMocks();
  await storage.removeItem(KEY);
  injectCSIfNotAlready.mockResolvedValue(true);
  sendMessageToAllFrames.mockResolvedValue([{ status: 'ok', canAutofillPassword: true, canAutofillUsername: true }]);
  restoreActionDataPassword.mockResolvedValue({ status: 'ok' });
  vi.spyOn(browser.i18n, 'getMessage').mockImplementation(key => key);
});

describe('handleAutofillWithPermission — direct fill unwraps the at-rest password (finding #5)', () => {
  it('decrypts the at-rest password to plaintext before transmitting when all domains are already trusted', async () => {
    await storage.setItem(KEY, JSON.stringify({
      actionData: { action: REQUEST_ACTIONS.AUTOFILL, username: 'u', password: 'enc-at-rest', passwordEncryptedAtRest: true, cryptoAvailable: false },
      closeData: {}
    }));
    loadAndClassifyCrossDomainPermissions.mockResolvedValue({ unknownDomains: [], crossDomainAllowedDomains: ['t.com'] });
    restoreActionDataPassword.mockImplementation(async actionData => {
      actionData.password = 'plaintext-pw';
      delete actionData.passwordEncryptedAtRest;

      return { status: 'ok' };
    });

    await handleAutofillWithPermission(9, KEY, ['t.com']);

    expect(restoreActionDataPassword).toHaveBeenCalled();

    const fillCall = findFillCall();
    expect(fillCall).toBeDefined();
    expect(fillCall[1].password).toBe('plaintext-pw');
    expect('passwordEncryptedAtRest' in fillCall[1]).toBe(false);
  });

  it('does not transmit anything when the at-rest password cannot be decrypted', async () => {
    await storage.setItem(KEY, JSON.stringify({
      actionData: { action: REQUEST_ACTIONS.AUTOFILL, password: 'enc-at-rest', passwordEncryptedAtRest: true, cryptoAvailable: false },
      closeData: {}
    }));
    loadAndClassifyCrossDomainPermissions.mockResolvedValue({ unknownDomains: [], crossDomainAllowedDomains: [] });
    restoreActionDataPassword.mockResolvedValue({ status: 'error' });

    await handleAutofillWithPermission(9, KEY, []);

    expect(findFillCall()).toBeUndefined();
    expect(await storage.getItem(KEY)).toBeNull();
  });
});
