// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getShadowRootsMock, getPasswordInputsMock, getUsernameInputsMock } = vi.hoisted(() => ({
  getShadowRootsMock: vi.fn(),
  getPasswordInputsMock: vi.fn(),
  getUsernameInputsMock: vi.fn()
}));

vi.mock('./getShadowRoots', () => ({ default: getShadowRootsMock }));
vi.mock('@/partials/inputFunctions/getPasswordInputs', () => ({ default: getPasswordInputsMock }));
vi.mock('@/partials/inputFunctions/getUsernameInputs', () => ({ default: getUsernameInputsMock }));

import getLoginInputs from './getLoginInputs';

describe('getLoginInputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scans the shadow DOM only once per pass', () => {
    getShadowRootsMock.mockReturnValue([]);
    getPasswordInputsMock.mockReturnValue([]);
    getUsernameInputsMock.mockReturnValue([]);

    getLoginInputs();

    expect(getShadowRootsMock).toHaveBeenCalledTimes(1);
  });

  it('shares the same shadow-roots array with the password and username getters', () => {
    const sharedRoots = [{ marker: 'shadow-root' }];

    getShadowRootsMock.mockReturnValue(sharedRoots);
    getPasswordInputsMock.mockReturnValue([]);
    getUsernameInputsMock.mockReturnValue([]);

    getLoginInputs();

    expect(getPasswordInputsMock).toHaveBeenCalledWith(sharedRoots);
    expect(getUsernameInputsMock).toHaveBeenCalledTimes(1);
    expect(getUsernameInputsMock.mock.calls[0][1]).toBe(sharedRoots);
  });

  it('passes the password forms as the first username getter argument', () => {
    const form = { tagName: 'FORM' };
    const passwordInput = { closest: () => form };

    getShadowRootsMock.mockReturnValue([]);
    getPasswordInputsMock.mockReturnValue([passwordInput]);
    getUsernameInputsMock.mockReturnValue([]);

    getLoginInputs();

    expect(getUsernameInputsMock.mock.calls[0][0]).toEqual([form]);
  });

  it('returns the resolved password and username inputs', () => {
    const passwordInputs = [{ closest: () => null }];
    const usernameInputs = [{ name: 'user' }];

    getShadowRootsMock.mockReturnValue([]);
    getPasswordInputsMock.mockReturnValue(passwordInputs);
    getUsernameInputsMock.mockReturnValue(usernameInputs);

    const result = getLoginInputs();

    expect(result.passwordInputs).toBe(passwordInputs);
    expect(result.usernameInputs).toBe(usernameInputs);
    expect(result.passwordForms).toEqual([]);
  });
});
