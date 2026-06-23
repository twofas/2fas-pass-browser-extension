// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

// initI18n is a content-script SW round-trip. The listener is registered without
// awaiting it (so the autofill/inject path answers immediately), so handlers that
// render localized text must await it themselves. These mocks let us drive that.
const h = vi.hoisted(() => {
  const holder = { resolve: () => {}, promise: null };
  const reset = () => {
    holder.promise = new Promise(resolve => { holder.resolve = resolve; });
  };

  reset();

  return {
    initI18n: vi.fn(() => holder.promise),
    resolveInit: () => holder.resolve(),
    reset
  };
});

vi.mock('@/utils/getMessage.js', () => ({
  initI18n: h.initI18n,
  resetI18nCache: vi.fn(),
  getMessage: vi.fn(key => key),
  getI18nState: vi.fn(() => ({ lang: 'default', isInitialized: false })),
  default: vi.fn(key => key)
}));

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn(), CatchError: vi.fn() }));

vi.mock('../functions/checkAutofillInputs', () => ({ default: vi.fn(() => ({ canAutofillPassword: false, canAutofillUsername: true, passwordInputsCount: 0, usernameInputsCount: 1 })) }));
vi.mock('../functions/checkAutofillInputsCard', () => ({ default: vi.fn(() => ({})) }));
vi.mock('../functions/checkIframePermission', () => ({ default: vi.fn(() => Promise.resolve({ needsPermission: false, frameInfo: {} })) }));
vi.mock('../functions/autofill', () => ({ default: vi.fn(() => Promise.resolve({ status: 'ok' })) }));
vi.mock('../functions/autofillCard', () => ({ default: vi.fn(() => Promise.resolve({ status: 'ok' })) }));
vi.mock('../functions/getDomainInfo', () => ({ default: vi.fn(() => ({})) }));
vi.mock('../functions/notification', () => ({ default: vi.fn(() => ({ status: 'ok' })) }));
vi.mock('../functions/matchingLogins', () => ({ default: vi.fn() }));
vi.mock('../functions/savePrompt', () => ({ default: vi.fn(), dismissAllSavePrompts: vi.fn() }));
vi.mock('../functions/refreshTheme', () => ({ default: vi.fn() }));
vi.mock('../functions/refreshLang', () => ({ default: vi.fn() }));
vi.mock('../functions/crossDomainDialog', () => ({ default: vi.fn() }));
vi.mock('../functions/e2eReadAutofillValues', () => ({ default: vi.fn(() => ({})) }));

import contentOnMessage from './contentOnMessage';
import checkAutofillInputs from '../functions/checkAutofillInputs';
import matchingLogins from '../functions/matchingLogins';

const TOP_FRAME = true;

describe('contentOnMessage i18n gating', () => {
  beforeEach(() => {
    h.reset();
    vi.clearAllMocks();
  });

  it('runs an autofill action (CHECK_AUTOFILL_INPUTS) immediately, without awaiting initI18n', () => {
    const sendResponse = vi.fn();

    const result = contentOnMessage(
      { action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS, target: REQUEST_TARGETS.CONTENT },
      {},
      sendResponse,
      TOP_FRAME,
      null,
      true
    );

    expect(result).toBe(true);
    expect(checkAutofillInputs).toHaveBeenCalledTimes(1);
    expect(sendResponse).toHaveBeenCalledTimes(1);
    expect(h.initI18n).not.toHaveBeenCalled();
  });

  it('defers an i18n-dependent action (MATCHING_LOGINS) until initI18n resolves', async () => {
    const sendResponse = vi.fn();

    const result = contentOnMessage(
      { action: REQUEST_ACTIONS.MATCHING_LOGINS, target: REQUEST_TARGETS.CONTENT },
      {},
      sendResponse,
      TOP_FRAME,
      {},
      true
    );

    expect(result).toBe(true);
    expect(matchingLogins).not.toHaveBeenCalled();

    h.resolveInit();

    await vi.waitFor(() => expect(matchingLogins).toHaveBeenCalledTimes(1));
  });
});
