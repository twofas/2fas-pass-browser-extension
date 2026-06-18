// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMessageToAllFrames = vi.fn();
const injectCSIfNotAlready = vi.fn();
const openPopupWithFallback = vi.fn();
const storeAutofillFailureData = vi.fn();
const finishLoginAutofill = vi.fn();

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

vi.mock('@/partials/functions', async () => ({
  sendMessageToAllFrames: (...args) => sendMessageToAllFrames(...args),
  aggregateLoginAutofillResponses: (await vi.importActual('@/partials/functions/aggregateLoginAutofillResponses')).default
}));

vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({
  default: (...args) => injectCSIfNotAlready(...args)
}));

vi.mock('./openPopupWithFallback', () => ({
  default: (...args) => openPopupWithFallback(...args)
}));

vi.mock('./storeAutofillFailureData', () => ({
  default: (...args) => storeAutofillFailureData(...args)
}));

vi.mock('../websocket/utils/finishPullRequestAutofill.js', () => ({
  finishLoginAutofill: (...args) => finishLoginAutofill(...args)
}));

import dispatchLoginAutofill from './dispatchLoginAutofill.js';

const KEY = 'session:autofillData-5';

const ignoreSavePromptCall = () =>
  sendMessageToAllFrames.mock.calls.find(([, message]) => message?.action === REQUEST_ACTIONS.IGNORE_SAVE_PROMPT);

beforeEach(async () => {
  vi.clearAllMocks();
  await storage.setItem(KEY, 'sentinel');
  injectCSIfNotAlready.mockResolvedValue(true);
  sendMessageToAllFrames.mockResolvedValue([{ status: 'ok', canAutofillPassword: true, canAutofillUsername: true }]);
  vi.spyOn(browser.runtime, 'sendMessage').mockResolvedValue(undefined);
});

describe('dispatchLoginAutofill — success path (non-windowClose)', () => {
  it('clears the storage key and emits both IGNORE_SAVE_PROMPT messages, with no failure escalation', async () => {
    const actionData = { action: REQUEST_ACTIONS.AUTOFILL, username: 'u', password: 'p' };

    await dispatchLoginAutofill(5, KEY, actionData, {});

    expect(await storage.getItem(KEY)).toBeNull();

    expect(ignoreSavePromptCall()).toBeDefined();
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      action: REQUEST_ACTIONS.IGNORE_SAVE_PROMPT,
      target: REQUEST_TARGETS.BACKGROUND_PROMPT,
      tabId: 5
    }));

    expect(storeAutofillFailureData).not.toHaveBeenCalled();
    expect(openPopupWithFallback).not.toHaveBeenCalled();
    expect(finishLoginAutofill).not.toHaveBeenCalled();
  });
});

describe('dispatchLoginAutofill — windowClose (shortcut) path', () => {
  it('delegates completion to finishLoginAutofill with the frame responses', async () => {
    const actionData = { action: REQUEST_ACTIONS.AUTOFILL, username: 'u', password: 'p' };
    const closeData = { windowClose: true, vaultId: 'v', s_password: 'pw' };
    const response = [{ status: 'ok', canAutofillPassword: true, canAutofillUsername: true }];
    sendMessageToAllFrames.mockResolvedValueOnce(response);

    await dispatchLoginAutofill(5, KEY, actionData, closeData);

    expect(finishLoginAutofill).toHaveBeenCalledTimes(1);
    expect(finishLoginAutofill).toHaveBeenCalledWith(5, actionData, closeData, response);
    expect(openPopupWithFallback).not.toHaveBeenCalled();
    expect(storeAutofillFailureData).not.toHaveBeenCalled();
    expect(ignoreSavePromptCall()).toBeUndefined();
    expect(await storage.getItem(KEY)).toBeNull();
  });

  it('delegates to finishLoginAutofill with false when the transmission throws', async () => {
    const actionData = { action: REQUEST_ACTIONS.AUTOFILL };
    const closeData = { windowClose: true };
    sendMessageToAllFrames.mockRejectedValueOnce(new Error('boom'));

    await dispatchLoginAutofill(5, KEY, actionData, closeData);

    expect(finishLoginAutofill).toHaveBeenCalledWith(5, actionData, closeData, false);
    expect(storeAutofillFailureData).not.toHaveBeenCalled();
    expect(openPopupWithFallback).not.toHaveBeenCalled();
    expect(await storage.getItem(KEY)).toBeNull();
  });
});

describe('dispatchLoginAutofill — failure escalation (non-windowClose)', () => {
  it('stores failure data and reopens the popup when the transmission throws', async () => {
    const closeData = { vaultId: 'v' };
    sendMessageToAllFrames.mockRejectedValueOnce(new Error('boom'));

    await dispatchLoginAutofill(5, KEY, { action: REQUEST_ACTIONS.AUTOFILL }, closeData);

    expect(storeAutofillFailureData).toHaveBeenCalledWith(5, closeData);
    expect(openPopupWithFallback).toHaveBeenCalledTimes(1);
    expect(finishLoginAutofill).not.toHaveBeenCalled();
    expect(await storage.getItem(KEY)).toBeNull();
  });

  it('stores failure data and reopens the popup when the response is empty', async () => {
    const closeData = { vaultId: 'v' };
    sendMessageToAllFrames.mockResolvedValueOnce(null);

    await dispatchLoginAutofill(5, KEY, { action: REQUEST_ACTIONS.AUTOFILL }, closeData);

    expect(storeAutofillFailureData).toHaveBeenCalledWith(5, closeData);
    expect(openPopupWithFallback).toHaveBeenCalledTimes(1);
    expect(ignoreSavePromptCall()).toBeUndefined();
  });

  it('stores failure data and reopens the popup when no frame reports ok', async () => {
    const closeData = { vaultId: 'v' };
    sendMessageToAllFrames.mockResolvedValueOnce([{ status: 'error', code: 'somethingElse' }]);

    await dispatchLoginAutofill(5, KEY, { action: REQUEST_ACTIONS.AUTOFILL }, closeData);

    expect(storeAutofillFailureData).toHaveBeenCalledWith(5, closeData);
    expect(openPopupWithFallback).toHaveBeenCalledTimes(1);
    expect(ignoreSavePromptCall()).toBeUndefined();
  });

  it('escalates a partial fill to the popup only for HIGHLY_SECRET items', async () => {
    const closeData = { vaultId: 'v', securityType: SECURITY_TIER.HIGHLY_SECRET };
    sendMessageToAllFrames.mockResolvedValueOnce([{ status: 'ok', canAutofillPassword: false, canAutofillUsername: true }]);

    await dispatchLoginAutofill(5, KEY, { action: REQUEST_ACTIONS.AUTOFILL, password: 'p' }, closeData);

    expect(storeAutofillFailureData).toHaveBeenCalledWith(5, closeData);
    expect(openPopupWithFallback).toHaveBeenCalledTimes(1);
    expect(ignoreSavePromptCall()).toBeUndefined();
  });

  it('does NOT escalate a partial fill for non-HIGHLY_SECRET items — it completes normally', async () => {
    const closeData = { vaultId: 'v', securityType: SECURITY_TIER.SECRET };
    sendMessageToAllFrames.mockResolvedValueOnce([{ status: 'ok', canAutofillPassword: false, canAutofillUsername: true }]);

    await dispatchLoginAutofill(5, KEY, { action: REQUEST_ACTIONS.AUTOFILL, password: 'p' }, closeData);

    expect(storeAutofillFailureData).not.toHaveBeenCalled();
    expect(openPopupWithFallback).not.toHaveBeenCalled();
    expect(ignoreSavePromptCall()).toBeDefined();
  });
});
