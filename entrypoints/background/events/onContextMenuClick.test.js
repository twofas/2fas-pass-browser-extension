// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('../contextMenu/initContextMenu', () => ({ default: vi.fn(async () => {}) }));
vi.mock('@/partials/sessionStorage/getItem', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/partials/sessionStorage/configured/getConfiguredBoolean', () => ({ default: vi.fn(async () => false) }));

vi.mock('../utils', () => ({
  openPopupWindowInNewWindow: vi.fn(async () => {}),
  sendAutofillToTab: vi.fn(async () => {}),
  sendCardAutofillToTab: vi.fn(async () => {})
}));

import initContextMenu from '../contextMenu/initContextMenu';
import getItem from '@/partials/sessionStorage/getItem';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import { openPopupWindowInNewWindow, sendAutofillToTab } from '../utils';
import onContextMenuClick from './onContextMenuClick.js';

const DEVICE_ID = '11111111-1111-4111-8111-111111111111';
const VAULT_ID = '22222222-2222-4222-8222-222222222222';
const ITEM_ID = '33333333-3333-4333-8333-333333333333';
const AUTOFILL_INFO = { menuItemId: `2fas-pass-autofill-${DEVICE_ID}|${VAULT_ID}|${ITEM_ID}` };
const TAB = { id: 7 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('onContextMenuClick — an autofill item left over from a session that is now locked', () => {
  it('rebuilds the menu and opens the popup so the user can unlock', async () => {
    getItem.mockResolvedValue(undefined);
    getConfiguredBoolean.mockResolvedValue(false);

    const result = await onContextMenuClick(AUTOFILL_INFO, TAB);

    expect(result).toBe(false);
    expect(initContextMenu).toHaveBeenCalledTimes(1);
    expect(openPopupWindowInNewWindow).toHaveBeenCalledTimes(1);
    expect(sendAutofillToTab).not.toHaveBeenCalled();
  });

  it('rebuilds the menu and opens the popup when reading the item throws', async () => {
    getItem.mockRejectedValue(new Error('locked'));
    getConfiguredBoolean.mockResolvedValue(false);

    await onContextMenuClick(AUTOFILL_INFO, TAB);

    expect(initContextMenu).toHaveBeenCalledTimes(1);
    expect(openPopupWindowInNewWindow).toHaveBeenCalledTimes(1);
  });

  it('only rebuilds the menu when the extension is unlocked but the item is gone', async () => {
    getItem.mockResolvedValue(undefined);
    getConfiguredBoolean.mockResolvedValue(true);

    await onContextMenuClick(AUTOFILL_INFO, TAB);

    expect(initContextMenu).toHaveBeenCalledTimes(1);
    expect(openPopupWindowInNewWindow).not.toHaveBeenCalled();
  });

  it('fills the tab when the item exists', async () => {
    const item = { contentType: 'login' };
    getItem.mockResolvedValue(item);

    const result = await onContextMenuClick(AUTOFILL_INFO, TAB);

    expect(result).toBe(true);
    expect(sendAutofillToTab).toHaveBeenCalledWith(TAB.id, DEVICE_ID, VAULT_ID, ITEM_ID);
    expect(initContextMenu).not.toHaveBeenCalled();
  });
});

describe('onContextMenuClick — the top "2FAS Pass Browser Extension" entry itself', () => {
  it('opens the popup when the parent entry is clicked (Safari lets it be chosen)', async () => {
    const result = await onContextMenuClick({ menuItemId: '2fas-pass-configured' }, TAB);

    expect(result).toBe(true);
    expect(openPopupWindowInNewWindow).toHaveBeenCalledTimes(1);
    expect(openPopupWindowInNewWindow).toHaveBeenCalledWith();
  });

  it('opens the popup without a tab as well', async () => {
    const result = await onContextMenuClick({ menuItemId: '2fas-pass-configured' }, undefined);

    expect(result).toBe(true);
    expect(openPopupWindowInNewWindow).toHaveBeenCalledTimes(1);
  });
});
