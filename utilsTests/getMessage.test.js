// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

// Mock CatchError module to prevent browser.runtime.getManifest errors
vi.mock('@/utils/CatchError.js', () => ({
  default: vi.fn()
}));

const mockMessages = {
  test_key: { message: 'Test Message' },
  another_key: { message: 'Another Message' }
};

describe('getMessage', () => {
  let browserI18nGetMessageSpy;
  let browserRuntimeGetURLSpy;
  let storageGetItemSpy;
  let fetchSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    resetI18nCache();

    browserI18nGetMessageSpy = vi.spyOn(browser.i18n, 'getMessage').mockImplementation(key => `native_${key}`);
    browserRuntimeGetURLSpy = vi.spyOn(browser.runtime, 'getURL').mockImplementation(path => `chrome-extension://test-id${path}`);
    storageGetItemSpy = vi.spyOn(storage, 'getItem').mockResolvedValue(null);

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMessages)
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('before initialization', () => {
    it('should use browser.i18n.getMessage as fallback', () => {
      const result = getMessage('test_key');

      expect(result).toBe('native_test_key');
      expect(browserI18nGetMessageSpy).toHaveBeenCalledWith('test_key');
    });
  });

  describe('when lang is default', () => {
    it('should return browser.i18n.getMessage result', async () => {
      storageGetItemSpy.mockResolvedValue('default');

      await initI18n();
      const result = getMessage('test_key');

      expect(result).toBe('native_test_key');
      expect(browserI18nGetMessageSpy).toHaveBeenCalledWith('test_key');
    });

    it('should return browser.i18n.getMessage when lang is null', async () => {
      storageGetItemSpy.mockResolvedValue(null);

      await initI18n();
      const result = getMessage('test_key');

      expect(result).toBe('native_test_key');
    });
  });

  describe('when lang is en or pl', () => {
    it('should return message from cached JSON', async () => {
      storageGetItemSpy.mockResolvedValue('en');
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessages)
      });

      await initI18n();
      const result = getMessage('test_key');

      expect(result).toBe('Test Message');
      expect(fetchSpy).toHaveBeenCalledWith('chrome-extension://test-id/_locales/en/messages.json');
    });

    it('should fallback to browser.i18n if key not found in cache', async () => {
      storageGetItemSpy.mockResolvedValue('en');
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessages)
      });

      await initI18n();
      const result = getMessage('missing_key');

      expect(result).toBe('native_missing_key');
      expect(browserI18nGetMessageSpy).toHaveBeenCalledWith('missing_key');
    });

    it('should fallback to default if fetch fails', async () => {
      storageGetItemSpy.mockResolvedValue('pl');
      fetchSpy.mockResolvedValue({
        ok: false
      });

      await initI18n();
      const state = getI18nState();

      expect(state.lang).toBe('default');
      expect(getMessage('test_key')).toBe('native_test_key');
    });

    it('should fallback to default if fetch throws error', async () => {
      storageGetItemSpy.mockResolvedValue('pl');
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await initI18n();
      const state = getI18nState();

      expect(state.lang).toBe('default');
    });
  });

  describe('initI18n', () => {
    it('should only initialize once when called multiple times', async () => {
      storageGetItemSpy.mockResolvedValue('default');

      const promise1 = initI18n();
      const promise2 = initI18n();

      await Promise.all([promise1, promise2]);

      // Check that storage.getItem for 'local:lang' was called only once
      const langCalls = storageGetItemSpy.mock.calls.filter(call => call[0] === 'local:lang');
      expect(langCalls.length).toBe(1);
    });

    it('should set isInitialized to true after completion', async () => {
      storageGetItemSpy.mockResolvedValue('default');

      expect(getI18nState().isInitialized).toBe(false);

      await initI18n();

      expect(getI18nState().isInitialized).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      storageGetItemSpy.mockRejectedValue(new Error('Storage error'));

      await initI18n();

      expect(getI18nState().lang).toBe('default');
      expect(getI18nState().isInitialized).toBe(true);
      expect(CatchError).toHaveBeenCalled();
    });
  });

  describe('resetI18nCache', () => {
    it('should reset all cached values', async () => {
      storageGetItemSpy.mockResolvedValue('en');
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessages)
      });

      await initI18n();

      expect(getI18nState().isInitialized).toBe(true);
      expect(getMessage('test_key')).toBe('Test Message');

      resetI18nCache();

      expect(getI18nState().isInitialized).toBe(false);
      expect(getMessage('test_key')).toBe('native_test_key');
    });

    it('should allow re-initialization after reset', async () => {
      storageGetItemSpy.mockResolvedValueOnce('default').mockResolvedValueOnce('en');
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessages)
      });

      await initI18n();
      expect(getI18nState().lang).toBe('default');

      resetI18nCache();
      await initI18n();

      expect(getI18nState().lang).toBe('en');
    });
  });

  describe('getI18nState', () => {
    it('should return current state with lang and isInitialized', async () => {
      storageGetItemSpy.mockResolvedValue('pl');
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessages)
      });

      await initI18n();
      const state = getI18nState();

      expect(state).toHaveProperty('lang', 'pl');
      expect(state).toHaveProperty('isInitialized', true);
    });
  });
});
