// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// A login that is already saved must not be offered again as a new one: the stored username is found whatever its
// letter case, and stored URI rules (StartsWith, Exact) are matched against the full page URL, not only against the
// origin Chromium reports as the request initiator.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const getItemsMock = vi.fn();

vi.mock('@/partials/sessionStorage/getItems', () => ({ default: (...args) => getItemsMock(...args) }));

import checkServicesData from './checkServicesData';

const MATCHER_DOMAIN = 0;
const MATCHER_STARTS_WITH = 2;
const MATCHER_EXACT = 3;

/**
* Creates a stored login with a local password.
* @param {Object} content - The login content (username, uris).
* @return {Object} The login.
*/
const createLogin = content => ({
  id: 'item-1',
  deviceId: 'device-1',
  vaultId: 'vault-1',
  contentType: 'login',
  content,
  sifExists: true,
  decryptSif: async () => ({ password: 'S3cret!' })
});

const xhrDetails = { tabId: 1, initiator: 'https://example.com', url: 'https://example.com/api/login' };
const TAB_URL = 'https://example.com/login';

describe('checkServicesData — finds a login that is already saved', () => {
  beforeEach(() => {
    getItemsMock.mockReset();
  });

  it('matches a stored username written with other letter case', async () => {
    getItemsMock.mockResolvedValue([createLogin({ username: 'Jan@Example.com', uris: [{ text: 'https://example.com', matcher: MATCHER_DOMAIN }] })]);

    await expect(checkServicesData(xhrDetails, { username: 'jan@example.com', password: 'S3cret!' }, TAB_URL)).resolves.toBe(false);
  });

  it('matches a StartsWith rule against the page URL when the request reports only the origin', async () => {
    getItemsMock.mockResolvedValue([createLogin({ username: 'jan@example.com', uris: [{ text: 'https://example.com/login', matcher: MATCHER_STARTS_WITH }] })]);

    await expect(checkServicesData(xhrDetails, { username: 'jan@example.com', password: 'S3cret!' }, TAB_URL)).resolves.toBe(false);
  });

  it('matches an Exact rule against the page URL when the request reports only the origin', async () => {
    getItemsMock.mockResolvedValue([createLogin({ username: 'jan@example.com', uris: [{ text: TAB_URL, matcher: MATCHER_EXACT }] })]);

    await expect(checkServicesData(xhrDetails, { username: 'jan@example.com', password: 'S3cret!' }, TAB_URL)).resolves.toBe(false);
  });

  it('still offers a new login for another username', async () => {
    getItemsMock.mockResolvedValue([createLogin({ username: 'jan@example.com', uris: [{ text: 'https://example.com', matcher: MATCHER_DOMAIN }] })]);

    await expect(checkServicesData(xhrDetails, { username: 'anna@example.com', password: 'S3cret!' }, TAB_URL)).resolves.toEqual({ type: 'newService' });
  });

  it('still offers a new login when no stored rule matches the page', async () => {
    getItemsMock.mockResolvedValue([createLogin({ username: 'jan@example.com', uris: [{ text: 'https://example.com/admin', matcher: MATCHER_STARTS_WITH }] })]);

    await expect(checkServicesData(xhrDetails, { username: 'jan@example.com', password: 'S3cret!' }, TAB_URL)).resolves.toEqual({ type: 'newService' });
  });
});
