// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSavePromptDomainSuppressionKey,
  isFetchedSifAutofill,
  suppressSavePromptForTabDomain,
  isSavePromptSuppressedForDomain,
  releaseSavePromptDomainSuppression,
  clearSavePromptDomainSuppression
} from './savePromptDomainSuppression';

const TAB_ID = 41;
const KEY = getSavePromptDomainSuppressionKey(TAB_ID);

describe('savePromptDomainSuppression', () => {
  beforeEach(async () => {
    await storage.removeItem(KEY);
  });

  afterEach(async () => {
    await storage.removeItem(KEY);
    vi.restoreAllMocks();
  });

  it('tells a fetch autofill (pulled SIF, not saved) from a vault autofill', () => {
    expect(isFetchedSifAutofill({ itemId: 'i1', s_password: 'enc', encryptionItemT2KeyB64: 'key' })).toBe(true);
    expect(isFetchedSifAutofill({ itemId: 'i1', securityType: 1 })).toBe(false);
    expect(isFetchedSifAutofill(undefined)).toBe(false);
  });

  it('suppresses the save prompt on every page of the root domain of the tab', async () => {
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ id: TAB_ID, url: 'https://login.example.com/sign-in' });

    await suppressSavePromptForTabDomain(TAB_ID);

    expect(await isSavePromptSuppressedForDomain(TAB_ID, 'https://login.example.com/sign-in')).toBe(true);
    expect(await isSavePromptSuppressedForDomain(TAB_ID, 'https://www.example.com/account')).toBe(true);
    expect(await isSavePromptSuppressedForDomain(TAB_ID, 'https://example.org/login')).toBe(false);
  });

  it('does not suppress other tabs', async () => {
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ id: TAB_ID, url: 'https://example.com/login' });

    await suppressSavePromptForTabDomain(TAB_ID);

    expect(await isSavePromptSuppressedForDomain(TAB_ID + 1, 'https://example.com/login')).toBe(false);
  });

  it('stores nothing when the tab URL cannot be read', async () => {
    vi.spyOn(browser.tabs, 'get').mockRejectedValue(new Error('No tab'));

    await suppressSavePromptForTabDomain(TAB_ID);

    expect(await storage.getItem(KEY)).toBeNull();
  });

  it('keeps the suppression while the tab stays on the domain and drops it when the tab leaves it', async () => {
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ id: TAB_ID, url: 'https://example.com/login' });
    await suppressSavePromptForTabDomain(TAB_ID);

    await releaseSavePromptDomainSuppression(TAB_ID, 'https://app.example.com/dashboard');
    expect(await isSavePromptSuppressedForDomain(TAB_ID, 'https://example.com/login')).toBe(true);

    await releaseSavePromptDomainSuppression(TAB_ID, 'https://other.com/');
    expect(await storage.getItem(KEY)).toBeNull();

    // Coming back to the domain later in the same tab asks again.
    expect(await isSavePromptSuppressedForDomain(TAB_ID, 'https://example.com/login')).toBe(false);
  });

  it('clears the suppression of a tab', async () => {
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ id: TAB_ID, url: 'https://example.com/login' });
    await suppressSavePromptForTabDomain(TAB_ID);

    await clearSavePromptDomainSuppression(TAB_ID);

    expect(await storage.getItem(KEY)).toBeNull();
  });
});
