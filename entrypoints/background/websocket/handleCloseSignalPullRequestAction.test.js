// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const addNewSessionIdToDevice = vi.fn();
const socketClose = vi.fn();
const sendMessageToAllFrames = vi.fn();
const sendMessageToTab = vi.fn();
const resolveCrossDomainPermissions = vi.fn();
const injectCSIfNotAlready = vi.fn();
const wsNotify = vi.fn();
const closePopupWindow = vi.fn();
const finishLoginAutofill = vi.fn();
const finishCardAutofill = vi.fn();
const protectActionDataPassword = vi.fn();
const protectCardActionData = vi.fn();
const focusTabForDialog = vi.fn();

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('./utils/addNewSessionIdToDevice', () => ({ default: (...args) => addNewSessionIdToDevice(...args) }));
vi.mock('.', () => ({ default: { getInstance: () => ({ close: socketClose }) } }));
vi.mock('@/partials/functions/sendMessageToAllFrames', () => ({ default: (...args) => sendMessageToAllFrames(...args) }));
vi.mock('@/partials/functions/sendMessageToTab', () => ({ default: (...args) => sendMessageToTab(...args) }));
vi.mock('@/partials/functions/resolveCrossDomainPermissions', () => ({ default: (...args) => resolveCrossDomainPermissions(...args) }));
vi.mock('@/partials/functions/focusTabForDialog', () => ({ default: (...args) => focusTabForDialog(...args) }));
vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({ default: (...args) => injectCSIfNotAlready(...args) }));
vi.mock('./wsNotify.js', () => ({ default: (...args) => wsNotify(...args) }));
vi.mock('./utils/finishPullRequestAutofill.js', () => ({
  closePopupWindow: (...args) => closePopupWindow(...args),
  finishLoginAutofill: (...args) => finishLoginAutofill(...args),
  finishCardAutofill: (...args) => finishCardAutofill(...args)
}));
vi.mock('../utils/protectActionDataPassword', () => ({ default: (...args) => protectActionDataPassword(...args) }));
vi.mock('../utils/protectCardActionData', () => ({ default: (...args) => protectCardActionData(...args) }));

import handleCloseSignalPullRequestAction from './handleCloseSignalPullRequestAction.js';

const TAB_ID = 7;
const KEY = `session:autofillData-${TAB_ID}`;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.spyOn(browser.i18n, 'getMessage').mockImplementation(key => key);
  await storage.removeItem(KEY);
  addNewSessionIdToDevice.mockResolvedValue(undefined);
  injectCSIfNotAlready.mockResolvedValue(true);
  sendMessageToAllFrames.mockResolvedValue([]);
  sendMessageToTab.mockResolvedValue({ status: 'ok' });
  resolveCrossDomainPermissions.mockResolvedValue({
    allBlocked: false,
    needsDialog: true,
    unknownDomains: ['cross.example'],
    crossDomainAllowedDomains: [],
    trustedDomains: [],
    untrustedDomains: []
  });
  protectActionDataPassword.mockImplementation(async actionData => ({
    status: 'ok',
    actionData: { ...actionData, password: 'enc-at-rest', passwordEncryptedAtRest: true }
  }));
  protectCardActionData.mockImplementation(async actionData => ({
    status: 'ok',
    actionData: { ...actionData, cardNumber: 'enc-cn', cardFieldsEncryptedAtRest: true }
  }));
});

describe('handleCloseSignalPullRequestAction — Highly Secret login never stored as plaintext (finding #5)', () => {
  const buildCloseData = () => ({
    action: 'autofill',
    windowClose: true,
    vaultId: 'v',
    deviceId: 'd',
    itemId: 'i',
    s_password: 'enc-sif',
    encryptionItemT2KeyB64: 'keyB64',
    actionData: {
      action: REQUEST_ACTIONS.AUTOFILL,
      username: 'u',
      password: 'plaintext-pw',
      cryptoAvailable: false,
      noPassword: false,
      target: REQUEST_TARGETS.CONTENT
    }
  });

  it('protects the password before writing the pending cross-domain payload to session storage', async () => {
    await handleCloseSignalPullRequestAction('new-session', 'uuid', buildCloseData(), { data: { tabId: TAB_ID } });

    expect(protectActionDataPassword).toHaveBeenCalled();

    const stored = JSON.parse(await storage.getItem(KEY));
    expect(stored.actionData.password).not.toBe('plaintext-pw');
    expect(stored.actionData.password).toBe('enc-at-rest');
    expect(stored.actionData.passwordEncryptedAtRest).toBe(true);
    // Recovery key is forwarded as a serializable Base64 string; the non-serializable HKDF
    // fields are gone (finding #29).
    expect(stored.closeData.encryptionItemT2KeyB64).toBe('keyB64');
    expect(stored.closeData.hkdfSaltAB).toBeUndefined();
    expect(stored.closeData.sessionKeyForHKDF).toBeUndefined();
  });
});

describe('handleCloseSignalPullRequestAction — Highly Secret card never stored as plaintext (finding #5)', () => {
  const CARD_KEY = `session:autofillCardData-${TAB_ID}`;

  const buildCardCloseData = () => ({
    action: 'autofillCard',
    windowClose: true,
    vaultId: 'v',
    deviceId: 'd',
    itemId: 'i',
    s_cardNumber: 'enc-sif-cn',
    s_expirationDate: 'enc-sif-ed',
    s_securityCode: 'enc-sif-cvv',
    encryptionItemT2KeyB64: 'keyB64',
    actionData: {
      action: REQUEST_ACTIONS.AUTOFILL_CARD,
      cardholderName: 'John Doe',
      cardIssuer: 'visa',
      cardNumber: '4111111111111111',
      cryptoAvailable: false,
      target: REQUEST_TARGETS.CONTENT
    }
  });

  beforeEach(async () => {
    await storage.removeItem(CARD_KEY);
  });

  it('protects the card fields before writing the pending cross-domain payload to session storage', async () => {
    await handleCloseSignalPullRequestAction('new-session', 'uuid', buildCardCloseData(), { data: { tabId: TAB_ID } });

    expect(protectCardActionData).toHaveBeenCalled();

    const stored = JSON.parse(await storage.getItem(CARD_KEY));
    expect(stored.actionData.cardNumber).not.toBe('4111111111111111');
    expect(stored.actionData.cardNumber).toBe('enc-cn');
    expect(stored.actionData.cardFieldsEncryptedAtRest).toBe(true);
    // Recovery key is forwarded as a serializable Base64 string; the non-serializable HKDF
    // fields are gone (finding #29).
    expect(stored.closeData.encryptionItemT2KeyB64).toBe('keyB64');
    expect(stored.closeData.hkdfSaltAB).toBeUndefined();
    expect(stored.closeData.sessionKeyForHKDF).toBeUndefined();

    await storage.removeItem(CARD_KEY);
  });
});

describe('handleCloseSignalPullRequestAction — cross-domain dialog send is validated (review #5)', () => {
  const buildCloseData = () => ({
    action: 'autofill',
    windowClose: true,
    vaultId: 'v',
    deviceId: 'd',
    itemId: 'i',
    s_password: 'enc-sif',
    encryptionItemT2KeyB64: 'keyB64',
    actionData: {
      action: REQUEST_ACTIONS.AUTOFILL,
      username: 'u',
      password: 'plaintext-pw',
      cryptoAvailable: false,
      noPassword: false,
      target: REQUEST_TARGETS.CONTENT
    }
  });

  it('cleans up the pending payload and closes the popup when the confirm dialog message is not delivered', async () => {
    // No content script listening: sendMessageToTab resolves to undefined (it does not throw),
    // so the encrypted payload must not be left orphaned in session storage.
    sendMessageToTab.mockResolvedValue(undefined);

    await handleCloseSignalPullRequestAction('new-session', 'uuid', buildCloseData(), { data: { tabId: TAB_ID } });

    expect(await storage.getItem(KEY)).toBeNull();
    expect(closePopupWindow).toHaveBeenCalledTimes(1);
    expect(wsNotify).toHaveBeenCalledWith('toast', expect.objectContaining({ type: 'info' }));
  });

  it('keeps the pending payload while the dialog is shown (status ok)', async () => {
    sendMessageToTab.mockResolvedValue({ status: 'ok', dialogShown: true });

    await handleCloseSignalPullRequestAction('new-session', 'uuid', buildCloseData(), { data: { tabId: TAB_ID } });

    expect(await storage.getItem(KEY)).not.toBeNull();
    expect(closePopupWindow).not.toHaveBeenCalled();

    await storage.removeItem(KEY);
  });
});

describe('handleCloseSignalPullRequestAction — non-windowClose login carries securityType (review #7)', () => {
  const buildCloseData = () => ({
    action: 'autofill',
    securityType: SECURITY_TIER.HIGHLY_SECRET,
    vaultId: 'v',
    deviceId: 'd',
    itemId: 'i',
    s_password: 'enc-sif',
    encryptionItemT2KeyB64: 'keyB64',
    actionData: {
      action: REQUEST_ACTIONS.AUTOFILL,
      username: 'u',
      password: 'plaintext-pw',
      cryptoAvailable: false,
      noPassword: false,
      target: REQUEST_TARGETS.CONTENT
    }
  });

  it('stores closeData.securityType so dispatchLoginAutofill can escalate a partial fill to KeepItem', async () => {
    vi.spyOn(browser.runtime, 'sendMessage').mockResolvedValue(undefined);

    await handleCloseSignalPullRequestAction('new-session', 'uuid', buildCloseData(), { data: { tabId: TAB_ID } });

    const stored = JSON.parse(await storage.getItem(KEY));
    expect(stored.closeData.securityType).toBe(SECURITY_TIER.HIGHLY_SECRET);

    await storage.removeItem(KEY);
  });
});
