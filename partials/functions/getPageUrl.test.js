// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, assert } from 'vitest';
import getPageUrl from './getPageUrl.js';

describe('getPageUrl', () => {
  describe('Chromium (initiator)', () => {
    it('returns details.initiator when it is a valid URL', () => {
      const details = {
        initiator: 'https://www.disneyplus.com',
        url: 'https://global.edge.bamgrid.com/v3/api/internal/account/login'
      };
      assert.equal(getPageUrl(details), 'https://www.disneyplus.com');
    });

    it('uses initiator even when other Firefox-style fields are also present', () => {
      const details = {
        initiator: 'https://www.disneyplus.com',
        originUrl: 'https://www.example.com/should-not-win',
        documentUrl: 'https://www.example.com/also-not-win',
        url: 'https://api.example.com'
      };
      assert.equal(getPageUrl(details), 'https://www.disneyplus.com');
    });

    it('falls back when initiator is the opaque-origin string "null"', () => {
      const details = {
        initiator: 'null',
        originUrl: 'https://www.example.com',
        url: 'https://api.example.com'
      };
      assert.equal(getPageUrl(details), 'https://www.example.com');
    });

    it('falls back when initiator is an empty string', () => {
      const details = {
        initiator: '',
        url: 'https://api.example.com'
      };
      assert.equal(getPageUrl(details), 'https://api.example.com');
    });
  });

  describe('Firefox (originUrl / documentUrl)', () => {
    it('returns details.originUrl when initiator is missing', () => {
      const details = {
        originUrl: 'https://accounts.firefox.example/signin',
        url: 'https://api.firefox.example/login'
      };
      assert.equal(getPageUrl(details), 'https://accounts.firefox.example/signin');
    });

    it('falls back to documentUrl when initiator and originUrl are missing', () => {
      const details = {
        documentUrl: 'https://accounts.firefox.example/signin',
        url: 'https://api.firefox.example/login'
      };
      assert.equal(getPageUrl(details), 'https://accounts.firefox.example/signin');
    });

    it('prefers originUrl over documentUrl when both are present', () => {
      const details = {
        originUrl: 'https://origin.example/page',
        documentUrl: 'https://document.example/page',
        url: 'https://api.example/login'
      };
      assert.equal(getPageUrl(details), 'https://origin.example/page');
    });

    it('falls through originUrl/documentUrl that are invalid', () => {
      const details = {
        originUrl: 'null',
        documentUrl: '',
        url: 'https://api.example/login'
      };
      assert.equal(getPageUrl(details, 'https://www.example.com/page'), 'https://www.example.com/page');
    });
  });

  describe('tabUrl fallback', () => {
    it('uses tabUrl when no Chromium or Firefox fields are present', () => {
      const details = {
        url: 'https://api.example.com/login'
      };
      assert.equal(getPageUrl(details, 'https://www.example.com/account'), 'https://www.example.com/account');
    });

    it('uses tabUrl when details has no useful origin fields', () => {
      const details = {
        initiator: undefined,
        originUrl: null,
        documentUrl: '',
        url: 'https://api.example.com/login'
      };
      assert.equal(getPageUrl(details, 'https://www.example.com'), 'https://www.example.com');
    });

    it('skips a tabUrl that fails URL validation', () => {
      const details = {
        url: 'https://api.example.com/login'
      };
      assert.equal(getPageUrl(details, 'not a url at all'), 'https://api.example.com/login');
    });
  });

  describe('details.url last-resort', () => {
    it('returns details.url when nothing else is available', () => {
      const details = { url: 'https://api.example.com/login' };
      assert.equal(getPageUrl(details), 'https://api.example.com/login');
    });

    it('returns details.url when every other candidate is invalid', () => {
      const details = {
        initiator: 'null',
        originUrl: '',
        documentUrl: undefined,
        url: 'https://api.example.com/login'
      };
      assert.equal(getPageUrl(details, 'random nonsense'), 'https://api.example.com/login');
    });
  });

  describe('safety', () => {
    it('returns undefined when details is missing entirely', () => {
      assert.isUndefined(getPageUrl(undefined));
    });

    it('returns undefined when details is null', () => {
      assert.isUndefined(getPageUrl(null));
    });

    it('does not crash on non-string candidates', () => {
      const details = {
        initiator: 123,
        originUrl: {},
        documentUrl: [],
        url: 'https://api.example.com'
      };
      assert.equal(getPageUrl(details), 'https://api.example.com');
    });
  });
});
