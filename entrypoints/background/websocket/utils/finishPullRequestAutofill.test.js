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
const storeAutofillFailureData = vi.fn();
const openPopupWithFallback = vi.fn();

vi.mock('../wsNotify.js', () => ({ default: (...args) => wsNotify(...args) }));
vi.mock('@/partials/functions/sendMessageToAllFrames', () => ({ default: (...args) => sendMessageToAllFrames(...args) }));
vi.mock('@/partials/functions/popupIsInSeparateWindow', () => ({ default: (...args) => popupIsInSeparateWindow(...args) }));
vi.mock('@/partials/functions/aggregateCardAutofillResponses', () => ({ default: (...args) => aggregateCardAutofillResponses(...args) }));
vi.mock('../../utils/storeAutofillFailureData', () => ({ default: (...args) => storeAutofillFailureData(...args) }));
vi.mock('../../utils/openPopupWithFallback', () => ({ default: (...args) => openPopupWithFallback(...args) }));

import { finishLoginAutofill, finishCardAutofill } from './finishPullRequestAutofill.js';
import { wsState } from '../wsState.js';

let windowsRemove;
let windowsUpdate;

const LOGIN_CLOSE = {
  windowClose: true,
  vaultId: 'v1',
  deviceId: 'd1',
  itemId: 'i1',
  s_password: 'pw',
  encryptionItemT2KeyB64: 'keyB64'
};

const CARD_CLOSE = {
  windowClose: true,
  vaultId: 'v1',
  deviceId: 'd1',
  itemId: 'i1',
  s_cardNumber: 'cn',
  s_expirationDate: 'ed',
  s_securityCode: 'cvv',
  encryptionItemT2KeyB64: 'keyB64'
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
  storeAutofillFailureData.mockResolvedValue(undefined);
  openPopupWithFallback.mockResolvedValue(undefined);
});

describe('finishLoginAutofill', () => {
  it('windowClose: no response (false) → focuses the popup window and routes to autofillT2Failed', async () => {
    await finishLoginAutofill(5, { username: 'u', password: 'p' }, LOGIN_CLOSE, false);

    expect(windowsUpdate).toHaveBeenCalledWith(99, { focused: true });
    expect(navigateState()).toMatchObject({ action: 'autofillT2Failed', s_password: 'pw', itemId: 'i1', encryptionItemT2KeyB64: 'keyB64' });
    expect(navigateState().hkdfSaltAB).toBeUndefined();
    expect(navigateState().sessionKeyForHKDF).toBeUndefined();
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

  // The in-popup (non-windowClose) autofill-via-fetch runs in the BACKGROUND. The toolbar popup may
  // be CLOSED (user approving on the phone) OR still OPEN on the /fetch "waiting" screen. KeepItem
  // recovery must work in BOTH cases:
  //   • DURABLE: storeAutofillFailureData persists the recovery STATE and openPopupWithFallback
  //     reopens a closed popup; useAutofillFailedCheck reads the key on ThisTab mount.
  //   • LIVE: a path-only wsNotify('navigate', { path: '/' }) moves an already-open popup off /fetch
  //     and remounts ThisTab so the same durable key is consumed. The navigate carries NO state — an
  //     ephemeral navigation state is dropped on reopen (main.jsx applies only the path), so the
  //     state must live solely in the durable key (else the open-popup case strands on /fetch).
  it('non-windowClose: no response (false) → durable KeepItem + path-only live navigate (open popup)', async () => {
    await finishLoginAutofill(5, { username: 'u', password: 'p' }, { ...LOGIN_CLOSE, windowClose: false }, false);

    expect(storeAutofillFailureData).toHaveBeenCalledWith(5, expect.objectContaining({ itemId: 'i1', s_password: 'pw', encryptionItemT2KeyB64: 'keyB64' }));
    expect(openPopupWithFallback).toHaveBeenCalledTimes(1);

    const navigate = wsNotify.mock.calls.find(([type]) => type === 'navigate');
    expect(navigate[1]).toEqual({ path: '/' });
    expect(navigateState()).toBeUndefined();
  });

  it('non-windowClose: partial fill → durable KeepItem + path-only live navigate', async () => {
    const res = [{ status: 'ok', canAutofillUsername: true, canAutofillPassword: false }];

    await finishLoginAutofill(5, { username: 'u', password: 'p' }, { ...LOGIN_CLOSE, windowClose: false }, res);

    expect(storeAutofillFailureData).toHaveBeenCalledWith(5, expect.objectContaining({ itemId: 'i1' }));
    expect(openPopupWithFallback).toHaveBeenCalledTimes(1);

    const navigate = wsNotify.mock.calls.find(([type]) => type === 'navigate');
    expect(navigate[1]).toEqual({ path: '/' });
    expect(navigateState()).toBeUndefined();
  });

  it('non-windowClose: no ok frame (all errors) → durable KeepItem + path-only live navigate', async () => {
    const res = [{ status: 'error', code: 'X' }];

    await finishLoginAutofill(5, { username: 'u', password: 'p' }, { ...LOGIN_CLOSE, windowClose: false }, res);

    expect(storeAutofillFailureData).toHaveBeenCalledWith(5, expect.objectContaining({ itemId: 'i1' }));
    expect(openPopupWithFallback).toHaveBeenCalledTimes(1);

    const navigate = wsNotify.mock.calls.find(([type]) => type === 'navigate');
    expect(navigate[1]).toEqual({ path: '/' });
  });

  // The fetch WS 'close' event (which clears wsState.active) is async and races with the popup
  // reopen. If the recovery reopens the popup while the fetch is still reported active, the fresh
  // popup's checkActiveWsAction forces the /fetch route over the KeepItem recovery (the user lands
  // on the fetch "waiting" view instead of the list with KeepItem). The recovery must mark the fetch
  // inactive synchronously so the reopen behaves like a normal open and lands on '/'.
  it('non-windowClose: failure marks the fetch WS inactive so the reopened popup lands on / not /fetch', async () => {
    wsState.active = true;
    wsState.type = 'fetch';
    wsState.fetchState = 0;

    await finishLoginAutofill(5, { username: 'u', password: 'p' }, { ...LOGIN_CLOSE, windowClose: false }, false);

    expect(wsState.active).toBe(false);
    expect(wsState.type).toBeNull();
    expect(wsState.fetchState).toBeNull();
  });

  it('windowClose: failure keeps the live wsNotify recovery and does NOT use durable popup-reopen', async () => {
    await finishLoginAutofill(5, { username: 'u', password: 'p' }, LOGIN_CLOSE, false);

    expect(storeAutofillFailureData).not.toHaveBeenCalled();
    expect(openPopupWithFallback).not.toHaveBeenCalled();
    expect(navigateState()).toMatchObject({ action: 'autofillT2Failed' });
  });
});

describe('finishCardAutofill', () => {
  it('windowClose: no response (false) → focuses the popup window and routes to autofillCardT2Failed', async () => {
    await finishCardAutofill(5, {}, CARD_CLOSE, false);

    expect(windowsUpdate).toHaveBeenCalledWith(99, { focused: true });
    expect(navigateState()).toMatchObject({ action: 'autofillCardT2Failed', s_cardNumber: 'cn', encryptionItemT2KeyB64: 'keyB64' });
    expect(navigateState().hkdfSaltAB).toBeUndefined();
    expect(navigateState().sessionKeyForHKDF).toBeUndefined();
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
