// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../tabs/injectPromptCSIntoActiveTabs', () => ({ default: vi.fn(async () => {}) }));
vi.mock('../contextMenu/contextMenuConfigured', () => ({ default: vi.fn(async () => {}) }));
vi.mock('../contextMenu/contextMenuNotConfigured', () => ({ default: vi.fn(async () => {}) }));
vi.mock('../utils', () => ({
  updateBadge: vi.fn(async () => {}),
  updateContextMenu: vi.fn(async () => {}),
  setBadgeLocked: vi.fn(async () => {}),
  notifyShareTabs: vi.fn(async () => {})
}));
vi.mock('@/partials/sessionStorage/getItems', () => ({ default: vi.fn(async () => []) }));

import onConfiguredChange from './onConfiguredChange';
import injectPromptCSIntoActiveTabs from '../tabs/injectPromptCSIntoActiveTabs';

describe('onConfiguredChange — prompt.js after unlocking', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await storage.removeItem('local:contextMenu');
  });

  it('injects prompt.js into the active tabs when the vault is unlocked', async () => {
    await onConfiguredChange(true);

    expect(injectPromptCSIntoActiveTabs).toHaveBeenCalledTimes(1);
  });

  it('injects prompt.js also when the context menu is turned off', async () => {
    await storage.setItem('local:contextMenu', false);
    browser.contextMenus = { removeAll: vi.fn(async () => {}) };

    await onConfiguredChange(true);

    expect(injectPromptCSIntoActiveTabs).toHaveBeenCalledTimes(1);
  });

  it('does not inject when the vault gets locked', async () => {
    await onConfiguredChange(false);

    expect(injectPromptCSIntoActiveTabs).not.toHaveBeenCalled();
  });
});
