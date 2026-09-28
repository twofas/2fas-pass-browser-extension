// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

import setIdleInterval from './setIdleInterval.js';

beforeEach(() => {
  browser.idle.setDetectionInterval = vi.fn();
});

describe('setIdleInterval', () => {
  it('uses the default detection interval for the "only on restart" choice', () => {
    setIdleInterval('default');
    expect(browser.idle.setDetectionInterval).toHaveBeenCalledWith(config.defaultStorageIdleLock * 60);
  });

  it('uses the default detection interval when no idle lock is stored', () => {
    setIdleInterval(null);
    expect(browser.idle.setDetectionInterval).toHaveBeenCalledWith(config.defaultStorageIdleLock * 60);
  });

  it('uses the default detection interval when the stored idle lock is undefined', () => {
    setIdleInterval(undefined);
    expect(browser.idle.setDetectionInterval).toHaveBeenCalledWith(config.defaultStorageIdleLock * 60);
  });

  it('uses the default detection interval for an unknown string value', () => {
    setIdleInterval('weird');
    expect(browser.idle.setDetectionInterval).toHaveBeenCalledWith(config.defaultStorageIdleLock * 60);
  });

  it('converts a minute value to seconds', () => {
    setIdleInterval(5);
    expect(browser.idle.setDetectionInterval).toHaveBeenCalledWith(300);
  });
});
