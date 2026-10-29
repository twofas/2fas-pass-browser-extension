// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

vi.mock('../utils', () => ({
  shortcutAutofill: vi.fn(async () => {}),
  showPrivateAccessInfo: vi.fn(async () => false)
}));

import { shortcutAutofill, showPrivateAccessInfo } from '../utils';
import onCommand from './onCommand.js';

const COMMAND = '2fas_pass_shortcut_autofill';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('onCommand — the autofill shortcut pressed in a window the extension cannot see', () => {
  it('shows the private access info instead of filling when no tab comes with the command and access is missing', async () => {
    showPrivateAccessInfo.mockResolvedValue(true);

    const result = await onCommand(COMMAND, undefined);

    expect(result).toBe(false);
    expect(showPrivateAccessInfo).toHaveBeenCalledTimes(1);
    expect(shortcutAutofill).not.toHaveBeenCalled();
  });

  it('fills as before when no tab comes with the command but access is granted', async () => {
    showPrivateAccessInfo.mockResolvedValue(false);

    const result = await onCommand(COMMAND, undefined);

    expect(result).toBe(true);
    expect(shortcutAutofill).toHaveBeenCalledTimes(1);
  });

  it('fills without checking access when the command comes with a tab', async () => {
    const result = await onCommand(COMMAND, { id: 7 });

    expect(result).toBe(true);
    expect(showPrivateAccessInfo).not.toHaveBeenCalled();
    expect(shortcutAutofill).toHaveBeenCalledTimes(1);
  });

  it('ignores unknown commands', async () => {
    const result = await onCommand('unknown', undefined);

    expect(result).toBe(false);
    expect(showPrivateAccessInfo).not.toHaveBeenCalled();
    expect(shortcutAutofill).not.toHaveBeenCalled();
  });
});
