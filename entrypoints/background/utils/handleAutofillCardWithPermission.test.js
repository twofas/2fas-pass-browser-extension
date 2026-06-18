// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMessageToAllFrames = vi.fn();
const sendMessageToTab = vi.fn();
const aggregateCardAutofillResponses = vi.fn();
const loadAndClassifyCrossDomainPermissions = vi.fn();
const injectCSIfNotAlready = vi.fn();
const notificationShow = vi.fn();
const restoreCardActionData = vi.fn();

vi.mock('@/partials/functions', () => ({
  sendMessageToAllFrames: (...args) => sendMessageToAllFrames(...args),
  sendMessageToTab: (...args) => sendMessageToTab(...args),
  aggregateCardAutofillResponses: (...args) => aggregateCardAutofillResponses(...args),
  loadAndClassifyCrossDomainPermissions: (...args) => loadAndClassifyCrossDomainPermissions(...args)
}));

vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({ default: (...args) => injectCSIfNotAlready(...args) }));
vi.mock('@/partials/TwofasNotification', () => ({ default: { show: (...args) => notificationShow(...args) } }));
vi.mock('./restoreCardActionData', () => ({ default: (...args) => restoreCardActionData(...args) }));

import handleAutofillCardWithPermission from './handleAutofillCardWithPermission.js';

const KEY = 'session:autofillCardData-9';

const findFillCall = () => sendMessageToAllFrames.mock.calls.find(([, message]) => message && 'cardNumber' in message);

beforeEach(async () => {
  vi.clearAllMocks();
  await storage.removeItem(KEY);
  injectCSIfNotAlready.mockResolvedValue(true);
  sendMessageToAllFrames.mockResolvedValue([{ status: 'ok' }]);
  aggregateCardAutofillResponses.mockReturnValue({ outcome: 'ok' });
  restoreCardActionData.mockResolvedValue({ status: 'ok' });
  vi.spyOn(browser.i18n, 'getMessage').mockImplementation(key => key);
});

describe('handleAutofillCardWithPermission — direct fill unwraps the at-rest card fields (finding #5)', () => {
  it('decrypts the at-rest card fields to plaintext before transmitting when all domains are already trusted', async () => {
    await storage.setItem(KEY, JSON.stringify({
      actionData: { action: REQUEST_ACTIONS.AUTOFILL_CARD, cardNumber: 'enc-cn', securityCode: 'enc-cvv', cardFieldsEncryptedAtRest: true, cryptoAvailable: false }
    }));
    loadAndClassifyCrossDomainPermissions.mockResolvedValue({ unknownDomains: [], crossDomainAllowedDomains: ['t.com'] });
    restoreCardActionData.mockImplementation(async actionData => {
      actionData.cardNumber = '4111111111111111';
      actionData.securityCode = '123';
      delete actionData.cardFieldsEncryptedAtRest;

      return { status: 'ok' };
    });

    await handleAutofillCardWithPermission(9, KEY, ['t.com']);

    expect(restoreCardActionData).toHaveBeenCalled();

    const fillCall = findFillCall();
    expect(fillCall).toBeDefined();
    expect(fillCall[1].cardNumber).toBe('4111111111111111');
    expect('cardFieldsEncryptedAtRest' in fillCall[1]).toBe(false);
  });

  it('does not transmit anything when the at-rest card fields cannot be decrypted', async () => {
    await storage.setItem(KEY, JSON.stringify({
      actionData: { action: REQUEST_ACTIONS.AUTOFILL_CARD, cardNumber: 'enc-cn', cardFieldsEncryptedAtRest: true, cryptoAvailable: false }
    }));
    loadAndClassifyCrossDomainPermissions.mockResolvedValue({ unknownDomains: [], crossDomainAllowedDomains: [] });
    restoreCardActionData.mockResolvedValue({ status: 'error' });

    await handleAutofillCardWithPermission(9, KEY, []);

    expect(findFillCall()).toBeUndefined();
    expect(await storage.getItem(KEY)).toBeNull();
  });
});
