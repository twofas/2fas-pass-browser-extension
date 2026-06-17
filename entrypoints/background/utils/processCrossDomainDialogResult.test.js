// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMessageToAllFrames = vi.fn();
const saveCrossDomainPreferences = vi.fn();
const aggregateCardAutofillResponses = vi.fn();
const injectCSIfNotAlready = vi.fn();
const notificationShow = vi.fn();
const openPopupWithFallback = vi.fn();
const finishLoginAutofill = vi.fn();
const finishCardAutofill = vi.fn();
const closePopupWindow = vi.fn();

vi.mock('@/partials/functions', () => ({
  sendMessageToAllFrames: (...args) => sendMessageToAllFrames(...args),
  saveCrossDomainPreferences: (...args) => saveCrossDomainPreferences(...args),
  aggregateCardAutofillResponses: (...args) => aggregateCardAutofillResponses(...args)
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

vi.mock('../websocket/utils/finishPullRequestAutofill.js', () => ({
  finishLoginAutofill: (...args) => finishLoginAutofill(...args),
  finishCardAutofill: (...args) => finishCardAutofill(...args),
  closePopupWindow: (...args) => closePopupWindow(...args)
}));

import processCrossDomainDialogResult from './processCrossDomainDialogResult.js';

const LOGIN_KEY = 'session:autofillData-7';
const CARD_KEY = 'session:autofillCardData-7';

const writeStored = async (key, data) => {
  await storage.setItem(key, JSON.stringify(data));
};

beforeEach(async () => {
  vi.clearAllMocks();
  await storage.removeItem(LOGIN_KEY);
  await storage.removeItem(CARD_KEY);
  injectCSIfNotAlready.mockResolvedValue(true);
  saveCrossDomainPreferences.mockResolvedValue(undefined);
  sendMessageToAllFrames.mockResolvedValue([{ status: 'ok' }]);
  vi.spyOn(browser.runtime, 'sendMessage').mockResolvedValue(undefined);
});

describe('processCrossDomainDialogResult — windowClose routing (finding #1)', () => {
  it('login confirmed + windowClose → delegates completion to finishLoginAutofill (not the popup-reopen path)', async () => {
    await writeStored(LOGIN_KEY, {
      actionData: { action: REQUEST_ACTIONS.AUTOFILL, username: 'u', password: 'p' },
      closeData: { windowClose: true, vaultId: 'v', deviceId: 'd', itemId: 'i', s_password: 'pw' },
      trustedDomains: ['t.com']
    });

    await processCrossDomainDialogResult({ storageKey: LOGIN_KEY, confirmed: true, domainPreferences: {}, allowedDomains: ['a.com'] });

    expect(finishLoginAutofill).toHaveBeenCalledTimes(1);

    const [tabIdArg, actionDataArg, closeDataArg, responseArg] = finishLoginAutofill.mock.calls[0];
    expect(tabIdArg).toBe(7);
    expect(closeDataArg).toMatchObject({ windowClose: true });
    expect(actionDataArg.crossDomainAllowedDomains).toEqual(['t.com', 'a.com']);
    expect(actionDataArg.iframePermissionGranted).toBe(true);
    expect(responseArg).toEqual([{ status: 'ok' }]);

    expect(openPopupWithFallback).not.toHaveBeenCalled();
    expect(await storage.getItem(LOGIN_KEY)).toBeNull();
  });

  it('card confirmed + windowClose → delegates completion to finishCardAutofill', async () => {
    await writeStored(CARD_KEY, {
      actionData: { action: REQUEST_ACTIONS.AUTOFILL_CARD },
      closeData: { windowClose: true, vaultId: 'v', deviceId: 'd', itemId: 'i', s_cardNumber: 'cn' },
      trustedDomains: []
    });

    await processCrossDomainDialogResult({ storageKey: CARD_KEY, confirmed: true, domainPreferences: {}, allowedDomains: [] });

    expect(finishCardAutofill).toHaveBeenCalledTimes(1);
    expect(finishCardAutofill.mock.calls[0][0]).toBe(7);
    expect(finishCardAutofill.mock.calls[0][2]).toMatchObject({ windowClose: true });
    expect(notificationShow).not.toHaveBeenCalled();
  });

  it('cancel + windowClose → closes the popup window and clears the stored data', async () => {
    await writeStored(LOGIN_KEY, {
      actionData: { action: REQUEST_ACTIONS.AUTOFILL },
      closeData: { windowClose: true },
      trustedDomains: []
    });

    await processCrossDomainDialogResult({ storageKey: LOGIN_KEY, confirmed: false });

    expect(closePopupWindow).toHaveBeenCalledTimes(1);
    expect(finishLoginAutofill).not.toHaveBeenCalled();
    expect(await storage.getItem(LOGIN_KEY)).toBeNull();
  });
});

describe('processCrossDomainDialogResult — non-windowClose unchanged', () => {
  it('login confirmed without windowClose → does NOT use the popup-window completion path', async () => {
    await writeStored(LOGIN_KEY, {
      actionData: { action: REQUEST_ACTIONS.AUTOFILL },
      closeData: { vaultId: 'v', deviceId: 'd', itemId: 'i' },
      trustedDomains: []
    });

    await processCrossDomainDialogResult({ storageKey: LOGIN_KEY, confirmed: true, domainPreferences: {}, allowedDomains: [] });

    expect(finishLoginAutofill).not.toHaveBeenCalled();
    expect(openPopupWithFallback).not.toHaveBeenCalled();
  });

  it('cancel without windowClose → clears stored data and does NOT touch the popup window', async () => {
    await writeStored(LOGIN_KEY, {
      actionData: { action: REQUEST_ACTIONS.AUTOFILL },
      closeData: { vaultId: 'v' },
      trustedDomains: []
    });

    await processCrossDomainDialogResult({ storageKey: LOGIN_KEY, confirmed: false });

    expect(closePopupWindow).not.toHaveBeenCalled();
    expect(await storage.getItem(LOGIN_KEY)).toBeNull();
  });

  it('returns early when storageKey is missing', async () => {
    await processCrossDomainDialogResult({ confirmed: true });

    expect(finishLoginAutofill).not.toHaveBeenCalled();
    expect(finishCardAutofill).not.toHaveBeenCalled();
    expect(closePopupWindow).not.toHaveBeenCalled();
    expect(sendMessageToAllFrames).not.toHaveBeenCalled();
  });
});
