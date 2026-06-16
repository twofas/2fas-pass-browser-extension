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
