// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';
import getKey from '@/partials/sessionStorage/getKey';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('../contextMenu/initContextMenu', () => ({ default: vi.fn() }));

vi.mock('../utils', async importOriginal => ({
  ...(await importOriginal()),
  setBadgeLocked: vi.fn(async () => {}),
  updateBadge: vi.fn(async () => {})
}));

import onStartup from './onStartup.js';

beforeEach(async () => {
  vi.clearAllMocks();
  await browser.storage.local.clear();
  await browser.storage.session.clear();
  browser.tabs.create = vi.fn(async () => ({}));

  if (!browser.idle) {
    browser.idle = {};
  }

  browser.idle.setDetectionInterval = vi.fn();

  if (browser.privacy?.services?.passwordSavingEnabled) {
    browser.privacy.services.passwordSavingEnabled.set = vi.fn().mockResolvedValue(undefined);
  }
});

describe('onStartup on the empty storage of a new Safari profile (the real migrations run)', () => {
  it('lets Connect derive the ephemeral key names, which failed with getKeyCryptoKeyNotFound', async () => {
    await expect(getKey('ephe_public_key', { uuid: 'b1f7d4a0-5a1e-4c3b-9f2d-0a6e8c1d2e3f' })).rejects.toMatchObject({ code: 9184 });

    await onStartup({ state: false });

    await expect(getKey('ephe_public_key', { uuid: 'b1f7d4a0-5a1e-4c3b-9f2d-0a6e8c1d2e3f' })).resolves.toEqual(expect.any(String));
    expect(await storage.getItem('local:migrationVersion')).toBeTypeOf('number');
  });

  it('does not open the onboarding page', async () => {
    await onStartup({ state: false });

    expect(browser.tabs.create).not.toHaveBeenCalled();
  });
});
