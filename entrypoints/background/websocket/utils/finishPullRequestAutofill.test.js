// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const wsNotify = vi.fn();
const sendMessageToAllFrames = vi.fn();
const popupIsInSeparateWindow = vi.fn();
const aggregateCardAutofillResponses = vi.fn();

vi.mock('../wsNotify.js', () => ({ default: (...args) => wsNotify(...args) }));
vi.mock('@/partials/functions/sendMessageToAllFrames', () => ({ default: (...args) => sendMessageToAllFrames(...args) }));
vi.mock('@/partials/functions/popupIsInSeparateWindow', () => ({ default: (...args) => popupIsInSeparateWindow(...args) }));
vi.mock('@/partials/functions/aggregateCardAutofillResponses', () => ({ default: (...args) => aggregateCardAutofillResponses(...args) }));

import { finishLoginAutofill, finishCardAutofill } from './finishPullRequestAutofill.js';

let windowsRemove;
let windowsUpdate;

const LOGIN_CLOSE = {
  windowClose: true,
  vaultId: 'v1',
  deviceId: 'd1',
  itemId: 'i1',
  s_password: 'pw',
  hkdfSaltAB: 'salt',
  sessionKeyForHKDF: 'sk'
};

const CARD_CLOSE = {
  windowClose: true,
  vaultId: 'v1',
  deviceId: 'd1',
  itemId: 'i1',
  s_cardNumber: 'cn',
  s_expirationDate: 'ed',
  s_securityCode: 'cvv',
  hkdfSaltAB: 'salt',
  sessionKeyForHKDF: 'sk'
};

const navigateState = () => {
  const call = wsNotify.mock.calls.find(([type]) => type === 'navigate');
  return call?.[1]?.options?.state;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(browser.i18n, 'getMessage').mockImplementation(key => key);
  vi.spyOn(browser.runtime, 'getURL').mockReturnValue('chrome-extension://x/popup.html');
  vi.spyOn(browser.runtime, 'sendMessage').mockResolvedValue(undefined);
  vi.spyOn(browser.tabs, 'query').mockResolvedValue([{ windowId: 99 }]);
  windowsRemove = vi.spyOn(browser.windows, 'remove').mockResolvedValue(undefined);
  windowsUpdate = vi.spyOn(browser.windows, 'update').mockResolvedValue(undefined);
});

describe('finishLoginAutofill', () => {
  it('windowClose: no response (false) → focuses the popup window and routes to autofillT2Failed', async () => {
    await finishLoginAutofill(5, { username: 'u', password: 'p' }, LOGIN_CLOSE, false);

    expect(windowsUpdate).toHaveBeenCalledWith(99, { focused: true });
    expect(navigateState()).toMatchObject({ action: 'autofillT2Failed', s_password: 'pw', itemId: 'i1' });
    expect(windowsRemove).not.toHaveBeenCalled();
  });

  it('windowClose: success (all fields filled) → ignores save prompt and closes the popup window, no success toast', async () => {
    const res = [{ status: 'ok', canAutofillUsername: true, canAutofillPassword: true }];

    await finishLoginAutofill(5, { username: 'u', password: 'p' }, LOGIN_CLOSE, res);

    expect(sendMessageToAllFrames).toHaveBeenCalledWith(5, expect.objectContaining({ action: REQUEST_ACTIONS.IGNORE_SAVE_PROMPT }));
    expect(windowsRemove).toHaveBeenCalledWith(99);

    const successToast = wsNotify.mock.calls.find(([type, payload]) => type === 'toast' && payload.type === 'success');
    expect(successToast).toBeUndefined();
  });

  it('windowClose: partial fill → focuses the popup window and routes to autofillT2Failed', async () => {
    const res = [{ status: 'ok', canAutofillUsername: true, canAutofillPassword: false }];

    await finishLoginAutofill(5, { username: 'u', password: 'p' }, LOGIN_CLOSE, res);

    expect(windowsUpdate).toHaveBeenCalledWith(99, { focused: true });
    expect(windowsRemove).not.toHaveBeenCalled();
    expect(navigateState()).toMatchObject({ action: 'autofillT2Failed' });
  });

  it('windowClose: no ok frame → focuses the popup window and routes to autofillT2Failed', async () => {
    const res = [{ status: 'error', code: 'X' }];

    await finishLoginAutofill(5, { username: 'u', password: 'p' }, LOGIN_CLOSE, res);

    expect(windowsUpdate).toHaveBeenCalledWith(99, { focused: true });
    expect(navigateState()).toMatchObject({ action: 'autofillT2Failed' });
  });

  it('non-windowClose: success → closes window when not separate and shows success toast', async () => {
    popupIsInSeparateWindow.mockResolvedValue(false);
    const res = [{ status: 'ok', canAutofillUsername: true, canAutofillPassword: true }];

    await finishLoginAutofill(5, { username: 'u', password: 'p' }, { ...LOGIN_CLOSE, windowClose: false }, res);

    expect(windowsRemove).toHaveBeenCalledWith(99);
    expect(windowsUpdate).not.toHaveBeenCalled();

    const successToast = wsNotify.mock.calls.find(([type, payload]) => type === 'toast' && payload.type === 'success');
    expect(successToast).toBeDefined();
  });
});

describe('finishCardAutofill', () => {
  it('windowClose: no response (false) → focuses the popup window and routes to autofillCardT2Failed', async () => {
    await finishCardAutofill(5, {}, CARD_CLOSE, false);

    expect(windowsUpdate).toHaveBeenCalledWith(99, { focused: true });
    expect(navigateState()).toMatchObject({ action: 'autofillCardT2Failed', s_cardNumber: 'cn' });
  });

  it('windowClose: full success → closes the popup window, no success toast', async () => {
    aggregateCardAutofillResponses.mockReturnValue({ isOk: true, isPartial: false, hasMissingInputs: false });

    await finishCardAutofill(5, {}, CARD_CLOSE, [{ status: 'ok' }]);

    expect(windowsRemove).toHaveBeenCalledWith(99);
    const successToast = wsNotify.mock.calls.find(([type, payload]) => type === 'toast' && payload.type === 'success');
    expect(successToast).toBeUndefined();
  });

  it('windowClose: missing inputs → focuses the popup window and routes to autofillCardT2Failed', async () => {
    aggregateCardAutofillResponses.mockReturnValue({ isOk: true, isPartial: false, hasMissingInputs: true });

    await finishCardAutofill(5, {}, CARD_CLOSE, [{ status: 'ok' }]);

    expect(windowsUpdate).toHaveBeenCalledWith(99, { focused: true });
    expect(navigateState()).toMatchObject({ action: 'autofillCardT2Failed' });
  });

  it('windowClose: partial → notifies partial toast and navigates home without touching the window', async () => {
    aggregateCardAutofillResponses.mockReturnValue({ isOk: false, isPartial: true, hasMissingInputs: false });

    await finishCardAutofill(5, {}, CARD_CLOSE, [{ status: 'partial' }]);

    expect(windowsRemove).not.toHaveBeenCalled();
    expect(windowsUpdate).not.toHaveBeenCalled();

    const navigate = wsNotify.mock.calls.find(([type]) => type === 'navigate');
    expect(navigate[1]).toEqual({ path: '/' });
  });

  it('windowClose: total failure → focuses the popup window and routes to autofillCardT2Failed', async () => {
    aggregateCardAutofillResponses.mockReturnValue({ isOk: false, isPartial: false, hasMissingInputs: false });

    await finishCardAutofill(5, {}, CARD_CLOSE, [{ status: 'error' }]);

    expect(windowsUpdate).toHaveBeenCalledWith(99, { focused: true });
    expect(navigateState()).toMatchObject({ action: 'autofillCardT2Failed' });
  });

  it('non-windowClose: full success → closes window when not separate and shows success toast', async () => {
    aggregateCardAutofillResponses.mockReturnValue({ isOk: true, isPartial: false, hasMissingInputs: false });
    popupIsInSeparateWindow.mockResolvedValue(false);

    await finishCardAutofill(5, {}, { ...CARD_CLOSE, windowClose: false }, [{ status: 'ok' }]);

    expect(windowsRemove).toHaveBeenCalledWith(99);
    const successToast = wsNotify.mock.calls.find(([type, payload]) => type === 'toast' && payload.type === 'success');
    expect(successToast).toBeDefined();
  });
});
