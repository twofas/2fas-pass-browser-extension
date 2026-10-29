// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('@/partials/sessionStorage/configured/getConfiguredBoolean', () => ({ default: vi.fn(async () => false) }));
vi.mock('@/partials/sessionStorage/getItems', () => ({ default: vi.fn(async () => []) }));

import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import restoreContextMenu from './restoreContextMenu.js';

beforeEach(async () => {
  vi.clearAllMocks();
  browser.contextMenus.removeAll = vi.fn(async () => {});
  browser.contextMenus.create = vi.fn();
  browser.i18n.getMessage = vi.fn(key => key);
  await browser.storage.local.clear();
});

describe('restoreContextMenu — Chrome restores the menu items of a reloaded extension while storage.session is wiped', () => {
  it('replaces the stale item list with the connect item when the extension is locked', async () => {
    getConfiguredBoolean.mockResolvedValue(false);

    await restoreContextMenu();

    expect(browser.contextMenus.removeAll).toHaveBeenCalledTimes(1);
    expect(browser.contextMenus.create).toHaveBeenCalledTimes(1);
    expect(browser.contextMenus.create).toHaveBeenCalledWith(expect.objectContaining({
      id: '2fas-pass-not-configured',
      contexts: ['all']
    }));
  });

  it('leaves the menu alone when the extension is unlocked', async () => {
    getConfiguredBoolean.mockResolvedValue(true);

    await restoreContextMenu();

    expect(browser.contextMenus.removeAll).not.toHaveBeenCalled();
    expect(browser.contextMenus.create).not.toHaveBeenCalled();
  });

  it('removes every item when the user turned the context menu off', async () => {
    getConfiguredBoolean.mockResolvedValue(false);
    await storage.setItem('local:contextMenu', false);

    await restoreContextMenu();

    expect(browser.contextMenus.removeAll).toHaveBeenCalledTimes(1);
    expect(browser.contextMenus.create).not.toHaveBeenCalled();
  });
});
