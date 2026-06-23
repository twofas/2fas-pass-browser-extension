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
