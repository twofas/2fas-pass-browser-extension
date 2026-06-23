// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Finding #47: the popup autofill path must forward hasPasswordInAnyFrame in its AUTOFILL
// message, exactly like the shortcut (sendAutofillToTab) and matching-logins
// (handleCloseSignalPullRequestAction) paths. Without it, autofill() calls
// setUsernameSkips(..., undefined, ...) and a username input sitting in a password-less form
// (password lives in another frame — common bank pattern) is marked twofas-pass-skip='true',
// which disables later save-prompt capture and makes the popup path diverge from the others.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMessageToAllFrames = vi.fn();
const popupIsInSeparateWindow = vi.fn();
const closeWindowIfNotInSeparateWindow = vi.fn();
const encryptValueForTransmission = vi.fn();
const resolveCrossDomainPermissions = vi.fn();
const aggregateLoginAutofillResponses = vi.fn();
const injectCSIfNotAlready = vi.fn();
const protectActionDataPassword = vi.fn();
const acquireAutofillTab = vi.fn();
const showT2Toast = vi.fn();
const showGenericToast = vi.fn();

vi.mock('@/partials/functions', () => ({
  sendMessageToAllFrames: (...args) => sendMessageToAllFrames(...args),
  popupIsInSeparateWindow: (...args) => popupIsInSeparateWindow(...args),
  closeWindowIfNotInSeparateWindow: (...args) => closeWindowIfNotInSeparateWindow(...args),
  encryptValueForTransmission: (...args) => encryptValueForTransmission(...args),
  resolveCrossDomainPermissions: (...args) => resolveCrossDomainPermissions(...args),
  aggregateLoginAutofillResponses: (...args) => aggregateLoginAutofillResponses(...args)
}));

vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({
  default: (...args) => injectCSIfNotAlready(...args)
}));

vi.mock('@/entrypoints/background/utils/protectActionDataPassword', () => ({
  default: (...args) => protectActionDataPassword(...args)
}));

vi.mock('./autofillPopupShared', () => ({
  acquireAutofillTab: (...args) => acquireAutofillTab(...args),
  showT2Toast: (...args) => showT2Toast(...args),
  showGenericToast: (...args) => showGenericToast(...args)
}));

vi.mock('@/models/itemModels/Login', () => ({
  default: { contentType: 'login' }
}));

import handleLoginAutofill from './handleLoginAutofill.js';

const navigate = vi.fn();

// AUTOFILL is the only sendMessageToAllFrames message that carries a username; the
// CHECK_AUTOFILL_INPUTS probe carries only action + target.
const isAutofillMessage = message => message && 'username' in message;
const getAutofillMessage = () => sendMessageToAllFrames.mock.calls.find(([, m]) => isAutofillMessage(m))?.[1];
const countInputCheckCalls = () => sendMessageToAllFrames.mock.calls.filter(([, m]) => !isAutofillMessage(m)).length;

const buildSecretItem = () => ({
  id: 'i1',
  deviceId: 'd1',
  vaultId: 'v1',
  securityType: 2, // SECRET
  sifExists: true,
  content: { username: 'user@example.com' },
  decryptSif: vi.fn(async () => ({ password: 'plaintext-secret' }))
});

const buildHighlySecretItem = () => ({
  id: 'i1',
  deviceId: 'd1',
  vaultId: 'v1',
  securityType: 1, // HIGHLY_SECRET
  sifExists: true,
  content: { username: 'user@example.com' },
  decryptSif: vi.fn(async () => ({ password: 'plaintext-secret' }))
});

beforeEach(() => {
  vi.clearAllMocks();
  acquireAutofillTab.mockResolvedValue({
    tab: { id: 1 },
    cryptoAvailableRes: { status: 'ok', cryptoAvailable: true }
  });
  encryptValueForTransmission.mockResolvedValue({ status: 'ok', data: 'enc-transport' });
  resolveCrossDomainPermissions.mockResolvedValue({ needsDialog: false, allBlocked: false, crossDomainAllowedDomains: [] });
  injectCSIfNotAlready.mockResolvedValue(true);
  // false → the success path delegates to the mocked closeWindowIfNotInSeparateWindow,
  // avoiding the real getMessage/i18n toast (unimplemented in the fake browser).
  popupIsInSeparateWindow.mockResolvedValue(false);
  closeWindowIfNotInSeparateWindow.mockResolvedValue(undefined);
  aggregateLoginAutofillResponses.mockReturnValue({ isOk: true, allFieldsFilled: true });
});

describe('handleLoginAutofill — forwards hasPasswordInAnyFrame (finding #47)', () => {
  it('sets hasPasswordInAnyFrame=true on the AUTOFILL message when another frame exposes a password input', async () => {
    sendMessageToAllFrames.mockImplementation(async (tabId, message) => {
      if (isAutofillMessage(message)) {
        return [{ status: 'ok', canAutofillPassword: false, canAutofillUsername: true }];
      }
      // CHECK_AUTOFILL_INPUTS: this frame has no password, another frame does.
      return [
        { status: 'ok', canAutofillPassword: false, canAutofillUsername: true },
        { status: 'ok', canAutofillPassword: true, canAutofillUsername: false }
      ];
    });

    await handleLoginAutofill(buildSecretItem(), navigate);

    const autofillMessage = getAutofillMessage();
    expect(autofillMessage).toBeDefined();
    expect(autofillMessage.hasPasswordInAnyFrame).toBe(true);
  });

  it('sets hasPasswordInAnyFrame=false when no frame exposes a password input', async () => {
    sendMessageToAllFrames.mockImplementation(async (tabId, message) => {
      if (isAutofillMessage(message)) {
        return [{ status: 'ok', canAutofillPassword: false, canAutofillUsername: true }];
      }
      return [{ status: 'ok', canAutofillPassword: false, canAutofillUsername: true }];
    });

    await handleLoginAutofill(buildSecretItem(), navigate);

    const autofillMessage = getAutofillMessage();
    expect(autofillMessage).toBeDefined();
    expect(autofillMessage.hasPasswordInAnyFrame).toBe(false);
  });

  it('reuses the Highly Secret CHECK_AUTOFILL_INPUTS probe instead of scanning the DOM twice', async () => {
    sendMessageToAllFrames.mockImplementation(async (tabId, message) => {
      if (isAutofillMessage(message)) {
        return [{ status: 'ok', canAutofillPassword: true, canAutofillUsername: true }];
      }
      return [{ status: 'ok', canAutofillPassword: true, canAutofillUsername: true }];
    });

    await handleLoginAutofill(buildHighlySecretItem(), navigate);

    const autofillMessage = getAutofillMessage();
    expect(autofillMessage).toBeDefined();
    expect(autofillMessage.hasPasswordInAnyFrame).toBe(true);
    // T2 already probes CHECK_AUTOFILL_INPUTS up front; the fix must not add a second full scan.
    expect(countInputCheckCalls()).toBe(1);
  });
});
