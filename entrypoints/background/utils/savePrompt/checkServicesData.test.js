// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Spec: the save prompt compares the typed credentials with the stored logins without the
// whitespace around them, because the values of the items are trimmed before saving.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const getItemsMock = vi.fn();

vi.mock('@/partials/sessionStorage/getItems', () => ({ default: (...args) => getItemsMock(...args) }));
vi.mock('@/partials/URIMatcher', () => ({ default: { getMatchedAccounts: items => items } }));
vi.mock('@/partials/functions', () => ({ getPageUrl: () => 'https://github.com/login' }));
vi.mock('./decryptValues', () => ({ default: async values => ({ username: values.username, password: values.password }) }));

import checkServicesData from './checkServicesData';

const createLogin = (username, password) => ({
  id: 'item-1',
  deviceId: 'device-1',
  vaultId: 'vault-1',
  contentType: 'login',
  content: { username },
  sifExists: true,
  decryptSif: async () => ({ password })
});

const details = { tabId: 1, url: 'https://github.com/login' };

describe('checkServicesData', () => {
  beforeEach(() => {
    getItemsMock.mockReset();
  });

  it('asks for nothing when the trimmed username and the exact password match a stored login', async () => {
    getItemsMock.mockResolvedValue([createLogin('me@2fas.com', ' secret ')]);

    await expect(checkServicesData(details, { username: ' me@2fas.com ', password: ' secret ' })).resolves.toBe(false);
  });

  it('matches a stored username that still has whitespace around it', async () => {
    getItemsMock.mockResolvedValue([createLogin(' me@2fas.com ', 'secret')]);

    await expect(checkServicesData(details, { username: 'me@2fas.com', password: 'secret' })).resolves.toBe(false);
  });

  it('compares the passwords exactly, so whitespace around the typed password is a different password', async () => {
    getItemsMock.mockResolvedValue([createLogin('me@2fas.com', 'secret')]);

    await expect(checkServicesData(details, { username: 'me@2fas.com', password: 'secret ' })).resolves.toEqual({
      type: 'updateService',
      contentType: 'login',
      deviceId: 'device-1',
      vaultId: 'vault-1',
      itemId: 'item-1'
    });
  });

  it('offers to update the password of the login with the matching trimmed username', async () => {
    getItemsMock.mockResolvedValue([createLogin('me@2fas.com', 'old')]);

    await expect(checkServicesData(details, { username: 'me@2fas.com\n', password: ' new ' })).resolves.toEqual({
      type: 'updateService',
      contentType: 'login',
      deviceId: 'device-1',
      vaultId: 'vault-1',
      itemId: 'item-1'
    });
  });

  it('offers a new login when the trimmed username differs', async () => {
    getItemsMock.mockResolvedValue([createLogin('me@2fas.com', 'secret')]);

    await expect(checkServicesData(details, { username: ' other@2fas.com ', password: 'secret' })).resolves.toEqual({ type: 'newService' });
  });
});
