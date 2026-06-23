// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Finding #41 (part 2): the queued save-prompt action carries the per-field
// encryption flags (usernameEncrypted / passwordEncrypted) so a later decrypt step
// (processSavePromptResult) can resolve each field according to its own state
// rather than a single global flag.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/partials/functions', () => ({
  getPageUrl: vi.fn(() => 'https://example.com/login')
}));

import addSavePromptAction from './addSavePromptAction';

describe('addSavePromptAction — per-field encryption flags', () => {
  beforeEach(() => {
    vi.stubGlobal('browser', { tabs: { get: vi.fn().mockResolvedValue({ url: 'https://example.com/login' }) } });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('stores usernameEncrypted and passwordEncrypted on the queued action (mixed state preserved)', async () => {
    const savePromptActions = [];
    const values = { username: 'CIPHER_U', password: 'hunter2', usernameEncrypted: true, passwordEncrypted: false };

    await addSavePromptAction({ tabId: 7 }, { type: 'newService' }, values, savePromptActions);

    expect(savePromptActions).toHaveLength(1);
    expect(savePromptActions[0]).toMatchObject({
      tabId: 7,
      username: 'CIPHER_U',
      password: 'hunter2',
      usernameEncrypted: true,
      passwordEncrypted: false
    });
  });

  it('defaults missing per-field flags to false', async () => {
    const savePromptActions = [];
    const values = { username: 'alice', password: 'hunter2' };

    await addSavePromptAction({ tabId: 3 }, { type: 'newService' }, values, savePromptActions);

    expect(savePromptActions[0].usernameEncrypted).toBe(false);
    expect(savePromptActions[0].passwordEncrypted).toBe(false);
  });
});
