// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('./openPopupWindowInNewWindow', () => ({ default: vi.fn(async () => {}) }));

import openPopupWindowInNewWindow from './openPopupWindowInNewWindow';
import showPrivateAccessInfo from './showPrivateAccessInfo.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('showPrivateAccessInfo — a private window the extension is not allowed into (e.g. the Mail.app sign-in window)', () => {
  it('opens the private access info when the extension may not run in private windows', async () => {
    browser.extension.isAllowedIncognitoAccess = vi.fn(async () => false);

    const result = await showPrivateAccessInfo();

    expect(result).toBe(true);
    expect(openPopupWindowInNewWindow).toHaveBeenCalledWith({ pathname: '/private-access' });
  });

  it('does nothing when the extension may run in private windows', async () => {
    browser.extension.isAllowedIncognitoAccess = vi.fn(async () => true);

    const result = await showPrivateAccessInfo();

    expect(result).toBe(false);
    expect(openPopupWindowInNewWindow).not.toHaveBeenCalled();
  });

  it('does nothing when the browser cannot tell', async () => {
    browser.extension.isAllowedIncognitoAccess = vi.fn(async () => {
      throw new Error('not supported');
    });

    const result = await showPrivateAccessInfo();

    expect(result).toBe(false);
    expect(openPopupWindowInNewWindow).not.toHaveBeenCalled();
  });
});
