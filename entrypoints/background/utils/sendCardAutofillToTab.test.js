// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMessageToTab = vi.fn();
const sendMessageToAllFrames = vi.fn();
const encryptCardSifForTransmission = vi.fn();
const resolveCrossDomainPermissions = vi.fn();
const saveCrossDomainPreferences = vi.fn();
const aggregateCardAutofillResponses = vi.fn();
const getItem = vi.fn();
const injectCSIfNotAlready = vi.fn();
const notificationShow = vi.fn();
const handleAutofillCardWithPermission = vi.fn();
const protectCardActionData = vi.fn();

vi.mock('@/partials/functions', () => ({
  sendMessageToAllFrames: (...args) => sendMessageToAllFrames(...args),
  sendMessageToTab: (...args) => sendMessageToTab(...args),
  encryptCardSifForTransmission: (...args) => encryptCardSifForTransmission(...args),
  resolveCrossDomainPermissions: (...args) => resolveCrossDomainPermissions(...args),
  saveCrossDomainPreferences: (...args) => saveCrossDomainPreferences(...args),
  aggregateCardAutofillResponses: (...args) => aggregateCardAutofillResponses(...args)
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

vi.mock('./handleAutofillCardWithPermission', () => ({
  default: (...args) => handleAutofillCardWithPermission(...args)
}));

vi.mock('./protectCardActionData', () => ({
  default: (...args) => protectCardActionData(...args)
}));

import sendCardAutofillToTab from './sendCardAutofillToTab.js';

const buildItem = () => ({
  sifExists: true,
  content: { cardHolder: 'John Doe', cardIssuer: 'visa' }
});

describe('sendCardAutofillToTab — GET_CRYPTO_AVAILABLE has no response (finding #12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    injectCSIfNotAlready.mockResolvedValue(true);
    getItem.mockResolvedValue(buildItem());
    resolveCrossDomainPermissions.mockResolvedValue({ needsDialog: false, allBlocked: false, crossDomainAllowedDomains: [] });
    encryptCardSifForTransmission.mockResolvedValue({ status: 'ok', cardNumber: 'cn', expirationDate: 'ed', securityCode: 'sc' });
    sendMessageToAllFrames.mockResolvedValue([{ status: 'ok', filledFields: {}, missingInputFields: [] }]);
    aggregateCardAutofillResponses.mockReturnValue({ outcome: 'ok' });
    protectCardActionData.mockImplementation(async actionData => ({ status: 'ok', actionData }));
  });

  it('does not throw when sendMessageToTab returns undefined for GET_CRYPTO_AVAILABLE', async () => {
    sendMessageToTab.mockResolvedValue(undefined);

    await expect(sendCardAutofillToTab(1, 'device', 'vault', 'item')).resolves.not.toThrow();
  });

  it('treats an undefined crypto response as crypto-unavailable for card encryption and the autofill payload', async () => {
    sendMessageToTab.mockResolvedValue(undefined);

    await sendCardAutofillToTab(1, 'device', 'vault', 'item');

    expect(encryptCardSifForTransmission).toHaveBeenCalledWith(expect.anything(), false);

    const autofillCall = sendMessageToAllFrames.mock.calls.find(([, message]) => message && message.cardholderName !== undefined);
    expect(autofillCall).toBeDefined();
    expect(autofillCall[1].cryptoAvailable).toBe(false);
  });

  it('does not surface any extra error notification when the crypto response is missing', async () => {
    sendMessageToTab.mockResolvedValue(undefined);

    await sendCardAutofillToTab(1, 'device', 'vault', 'item');

    expect(notificationShow).not.toHaveBeenCalled();
  });

  it('still flags crypto as available when the content script reports it', async () => {
    sendMessageToTab.mockResolvedValue({ status: 'ok', cryptoAvailable: true });

    await sendCardAutofillToTab(1, 'device', 'vault', 'item');

    expect(encryptCardSifForTransmission).toHaveBeenCalledWith(expect.anything(), true);
  });
});

describe('sendCardAutofillToTab — cross-domain dialog uses the storage-key handoff (finding #1)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await storage.removeItem('session:autofillCardData-7');
    injectCSIfNotAlready.mockResolvedValue(true);
    getItem.mockResolvedValue(buildItem());
    sendMessageToTab.mockResolvedValue({ status: 'ok', cryptoAvailable: true });
    encryptCardSifForTransmission.mockResolvedValue({ status: 'ok', cardNumber: 'cn', expirationDate: 'ed', securityCode: 'sc' });
    resolveCrossDomainPermissions.mockResolvedValue({
      needsDialog: true,
      allBlocked: false,
      trustedDomains: ['trusted.com'],
      untrustedDomains: ['untrusted.com'],
      unknownDomains: ['unknown.com'],
      crossDomainAllowedDomains: ['trusted.com']
    });
    protectCardActionData.mockImplementation(async actionData => ({ status: 'ok', actionData }));
  });

  it('delegates to handleAutofillCardWithPermission with the stored actionData and the full domain list', async () => {
    await sendCardAutofillToTab(7, 'device', 'vault', 'item');

    expect(handleAutofillCardWithPermission).toHaveBeenCalledTimes(1);

    const [tabIdArg, storageKeyArg, domainsArg] = handleAutofillCardWithPermission.mock.calls[0];
    expect(tabIdArg).toBe(7);
    expect(storageKeyArg).toBe('session:autofillCardData-7');
    expect(domainsArg).toEqual(['trusted.com', 'untrusted.com', 'unknown.com']);

    const stored = JSON.parse(await storage.getItem('session:autofillCardData-7'));
    expect(stored.actionData.cardholderName).toBe('John Doe');
  });

  it('does not show the inline cross-domain dialog itself', async () => {
    await sendCardAutofillToTab(7, 'device', 'vault', 'item');

    const dialogCall = sendMessageToTab.mock.calls.find(([, message]) => message && message.unknownDomains !== undefined);
    expect(dialogCall).toBeUndefined();
  });

  it('does not fill the frames directly when the dialog path is taken', async () => {
    await sendCardAutofillToTab(7, 'device', 'vault', 'item');

    const autofillCall = sendMessageToAllFrames.mock.calls.find(([, message]) => message && message.cardholderName !== undefined);
    expect(autofillCall).toBeUndefined();
  });
});

describe('sendCardAutofillToTab — card fields never stored as plaintext at rest (finding #5)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await storage.removeItem('session:autofillCardData-7');
    injectCSIfNotAlready.mockResolvedValue(true);
    getItem.mockResolvedValue(buildItem());
    sendMessageToTab.mockResolvedValue(undefined); // cryptoAvailable = false
    encryptCardSifForTransmission.mockResolvedValue({ status: 'ok', cardNumber: '4111111111111111', expirationDate: '12/30', securityCode: '123' });
    handleAutofillCardWithPermission.mockResolvedValue(undefined);
    resolveCrossDomainPermissions.mockResolvedValue({
      needsDialog: true,
      allBlocked: false,
      trustedDomains: [],
      untrustedDomains: [],
      unknownDomains: ['unknown.com'],
      crossDomainAllowedDomains: []
    });
    protectCardActionData.mockImplementation(async actionData => ({
      status: 'ok',
      actionData: { ...actionData, cardNumber: 'enc-cn', expirationDate: 'enc-ed', securityCode: 'enc-cvv', cardFieldsEncryptedAtRest: true }
    }));
  });

  it('protects the card fields before writing the pending cross-domain payload', async () => {
    await sendCardAutofillToTab(7, 'device', 'vault', 'item');

    expect(protectCardActionData).toHaveBeenCalled();

    const stored = JSON.parse(await storage.getItem('session:autofillCardData-7'));
    expect(stored.actionData.cardNumber).not.toBe('4111111111111111');
    expect(stored.actionData.cardNumber).toBe('enc-cn');
    expect(stored.actionData.cardFieldsEncryptedAtRest).toBe(true);

    await storage.removeItem('session:autofillCardData-7');
  });
});
