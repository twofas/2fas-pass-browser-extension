// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Finding #41 (part 2): onTabUpdated is a SECOND producer of the
// session:savePromptContext-<tabId> round-trip (the first being savePromptAction).
// It hand-rebuilds the `values` object from a queued save-prompt action, so it must
// carry the per-field encryption flags (usernameEncrypted / passwordEncrypted). If
// it kept emitting a single `encrypted` flag, processSavePromptResult's per-field
// guard would fall through to the plaintext branch and forward AES-GCM ciphertext
// into the vault as if it were the plaintext credential in default_encrypted mode.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../utils', () => ({
  sendDomainToPopupWindow: vi.fn(async () => {}),
  sendSavePromptToTab: vi.fn(async () => {}),
  removeSavePromptAction: vi.fn(),
  checkDomainOnIgnoredList: vi.fn(async () => false),
  getRootDomain: vi.fn(hostname => hostname),
  setBadgeLocked: vi.fn(async () => {}),
  setBadgeIcon: vi.fn(async () => {}),
  setBadgeText: vi.fn(async () => {})
}));

vi.mock('./isTabIsPopupWindow', () => ({ default: vi.fn(async () => false) }));
vi.mock('../contextMenu/updateNoAccountItem', () => ({ default: vi.fn(async () => {}) }));
vi.mock('@/partials/contentScript/checkPromptCS', () => ({ default: vi.fn(async () => {}) }));
vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({ default: vi.fn(async () => {}) }));
vi.mock('@/partials/sessionStorage/getItems', () => ({ default: vi.fn(async () => []) }));
vi.mock('@/partials/sessionStorage/configured/getConfiguredBoolean', () => ({ default: vi.fn(async () => true) }));

import onTabUpdated from './onTabUpdated.js';
import { sendSavePromptToTab } from '../utils';

describe('onTabUpdated — save-prompt context carries per-field encryption flags (finding #41)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await storage.removeItem('session:savePromptContext-77');
    await storage.removeItem('session:savePromptSuppressed-77');
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ active: true, url: 'https://example.com/login' });
    await storage.setItem('local:savePrompt', 'default_encrypted');
  });

  afterEach(async () => {
    await storage.removeItem('session:savePromptContext-77');
    await storage.removeItem('local:savePrompt');
    vi.restoreAllMocks();
  });

  it('rebuilds the context with usernameEncrypted/passwordEncrypted from the queued action', async () => {
    const action = {
      tabId: 77,
      url: 'https://example.com/login',
      tabUrl: 'https://example.com/login',
      username: 'CIPHER_U',
      password: 'CIPHER_P',
      usernameEncrypted: true,
      passwordEncrypted: true,
      serviceTypeData: { type: 'newService' }
    };
    const tabUpdateData = {};

    await onTabUpdated(77, { status: 'complete' }, [action], tabUpdateData);

    const ctxJson = await storage.getItem('session:savePromptContext-77');
    expect(ctxJson).toBeTruthy();

    const ctx = JSON.parse(ctxJson);
    expect(ctx.values.username).toBe('CIPHER_U');
    expect(ctx.values.password).toBe('CIPHER_P');
    expect(ctx.values.usernameEncrypted).toBe(true);
    expect(ctx.values.passwordEncrypted).toBe(true);
  });

  it('preserves a mixed state (encrypted username + plaintext password)', async () => {
    const action = {
      tabId: 77,
      url: 'https://example.com/login',
      tabUrl: 'https://example.com/login',
      username: 'CIPHER_U',
      password: 'hunter2',
      usernameEncrypted: true,
      passwordEncrypted: false,
      serviceTypeData: { type: 'newService' }
    };
    const tabUpdateData = {};

    await onTabUpdated(77, { status: 'complete' }, [action], tabUpdateData);

    const ctx = JSON.parse(await storage.getItem('session:savePromptContext-77'));
    expect(ctx.values.usernameEncrypted).toBe(true);
    expect(ctx.values.passwordEncrypted).toBe(false);
  });
});

describe('onTabUpdated — a save prompt does not follow the user across the site', () => {
  const tabId = 88;
  const action = () => ({
    tabId,
    url: 'https://example.com',
    tabUrl: 'https://example.com/login',
    username: 'u',
    password: 'p',
    serviceTypeData: { type: 'newService' }
  });

  /**
  * Simulates one navigation of the tab: 'loading' and then 'complete' on the given url.
  * @param {string} url - The url the tab navigates to.
  * @param {Array} actions - The save prompt actions.
  * @param {Object} tabUpdateData - The tab update data.
  * @return {Promise<void>}
  */
  const navigate = async (url, actions, tabUpdateData) => {
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ id: tabId, active: true, url, status: 'complete' });
    await onTabUpdated(tabId, { status: 'loading', url }, actions, tabUpdateData);
    await onTabUpdated(tabId, { status: 'complete' }, actions, tabUpdateData);
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await storage.setItem('local:savePrompt', 'default');
    await storage.removeItem(`session:savePromptContext-${tabId}`);
  });

  afterEach(async () => {
    await storage.removeItem(`session:savePromptContext-${tabId}`);
    await storage.removeItem('local:savePrompt');
    vi.restoreAllMocks();
  });

  it('drops an ignored prompt when the user moves on to other pages', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const actions = [{ ...action(), displayedAt: 1_000_000 }];
    const tabUpdateData = {};

    for (const [index, url] of ['https://example.com/products', 'https://example.com/about', 'https://example.com/cart'].entries()) {
      now.mockReturnValue(1_000_000 + (index + 1) * 20_000);
      await navigate(url, actions, tabUpdateData);
    }

    expect(sendSavePromptToTab).not.toHaveBeenCalled();
    expect(actions).toHaveLength(0);
  });

  it('keeps the action when only a frame of the page loads (no url change)', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_100_000);
    const actions = [{ ...action(), displayedAt: 1_000_000 }];
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ id: tabId, active: true, url: 'https://example.com/login', status: 'loading' });

    await onTabUpdated(tabId, { status: 'loading' }, actions, {});

    expect(actions).toHaveLength(1);
  });

  it('shows the prompt again on the page a login redirected to right after it appeared', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_500);
    const actions = [{ ...action(), displayedAt: 1_000_000 }];

    await navigate('https://example.com/dashboard', actions, {});

    expect(sendSavePromptToTab).toHaveBeenCalledTimes(1);
  });

  it('takes the prompt along to a page a slow login redirected to 4 s after it appeared', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_004_000);
    const actions = [{ ...action(), displayedAt: 1_000_000 }];

    await navigate('https://example.com/dashboard', actions, {});

    expect(sendSavePromptToTab).toHaveBeenCalledTimes(1);
  });

  it('drops an action that could not be shown within a minute instead of showing it on a later page', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000 + 61_000);
    const actions = [{ ...action(), createdAt: 1_000_000 }];

    await navigate('https://example.com/products', actions, {});

    expect(sendSavePromptToTab).not.toHaveBeenCalled();
    expect(actions).toHaveLength(0);
  });

  it('shows the prompt once after a form post navigation and not on the next pages', async () => {
    sendSavePromptToTab.mockResolvedValue(true);
    const now = vi.spyOn(Date, 'now').mockReturnValue(2_000_000);
    const actions = [action()];
    const tabUpdateData = {};

    await navigate('https://example.com/account', actions, tabUpdateData);
    now.mockReturnValue(2_030_000);
    await navigate('https://example.com/products', actions, tabUpdateData);

    expect(sendSavePromptToTab).toHaveBeenCalledTimes(1);
    expect(actions).toHaveLength(0);
  });
});

describe('onTabUpdated — save prompt turned off by a fetch & autofill', () => {
  const KEY = 'session:savePromptDomainSuppressed-78';

  beforeEach(async () => {
    vi.clearAllMocks();
    await storage.setItem(KEY, 'example.com');
  });

  afterEach(async () => {
    await storage.removeItem(KEY);
  });

  it('stays off while the tab navigates within the domain', async () => {
    await onTabUpdated(78, { status: 'loading', url: 'https://app.example.com/dashboard' }, [], {});

    expect(await storage.getItem(KEY)).toBe('example.com');
  });

  it('comes back when the tab navigates to another domain', async () => {
    await onTabUpdated(78, { status: 'loading', url: 'https://other.com/' }, [], {});

    expect(await storage.getItem(KEY)).toBeNull();
  });
});
