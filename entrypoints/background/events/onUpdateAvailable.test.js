// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const loggerInfo = vi.fn();
vi.mock('@/utils/logger', () => {
  const logger = { info: (...args) => loggerInfo(...args), debug: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { logger, default: logger };
});

import onUpdateAvailable from './onUpdateAvailable.js';

beforeEach(() => {
  vi.clearAllMocks();
  browser.runtime.sendMessage = vi.fn(async () => ({ status: 'ok' }));
});

describe('onUpdateAvailable', () => {
  it('logs the version that is ready to install', async () => {
    await onUpdateAvailable({ version: '1.8.13' });

    expect(loggerInfo).toHaveBeenCalledWith(
      LOGGER_CONSTANTS.CATEGORIES.SYSTEM,
      'BackgroundSW - update available',
      { version: '1.8.13' }
    );
  });

  it('notifies the popup about the update', async () => {
    await onUpdateAvailable({ version: '1.8.13' });

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      action: REQUEST_ACTIONS.UPDATE_AVAILABLE,
      target: REQUEST_TARGETS.POPUP_THIS_TAB,
      version: '1.8.13'
    });
  });
});
