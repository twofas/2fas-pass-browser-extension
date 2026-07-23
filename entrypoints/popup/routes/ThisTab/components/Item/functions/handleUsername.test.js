// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Issue #46: the handler is the defense-in-depth guard behind the disabled copy button.
// An empty username must never reach the clipboard (no copyValue call, no success toast);
// instead the same explanatory message shown by the tooltip appears as an error toast.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const getItem = vi.fn();
const copyValue = vi.fn();
const showToastMock = vi.fn();

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('@/utils/showToast.js', () => ({ default: (...args) => showToastMock(...args) }));
vi.mock('@/utils/getMessage.js', () => ({
  getMessage: key => key,
  initI18n: vi.fn(),
  resetI18nCache: vi.fn(),
  getI18nState: vi.fn()
}));

vi.mock('@/partials/sessionStorage/getItem', () => ({
  default: (...args) => getItem(...args)
}));

vi.mock('@/partials/functions/copyValue', () => ({
  default: (...args) => copyValue(...args)
}));

import handleUsername from './handleUsername.js';

const buildItem = username => ({
  id: 'item-1',
  content: { username }
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleUsername — empty username guard (issue #46)', () => {
  it('does not copy and shows the explanatory error toast when the username is empty', async () => {
    getItem.mockResolvedValue(buildItem(''));

    await handleUsername('dev-1', 'vault-1', 'item-1', false, () => {});

    expect(copyValue).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith('this_tab_copy_disabled_no_username', 'error');
  });

  it('does not copy when the username is undefined', async () => {
    getItem.mockResolvedValue(buildItem(undefined));

    await handleUsername('dev-1', 'vault-1', 'item-1', false, () => {});

    expect(copyValue).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith('this_tab_copy_disabled_no_username', 'error');
  });

  it('copies and shows the success toast when the username is stored', async () => {
    getItem.mockResolvedValue(buildItem('user@example.com'));

    await handleUsername('dev-1', 'vault-1', 'item-1', false, () => {});

    expect(copyValue).toHaveBeenCalledWith('user@example.com', 'dev-1', 'vault-1', 'item-1', 'username');
    expect(showToastMock).toHaveBeenCalledWith('notification_username_copied', 'success');
  });
});
