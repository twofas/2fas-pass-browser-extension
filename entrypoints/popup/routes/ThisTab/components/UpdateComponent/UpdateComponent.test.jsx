// @vitest-environment jsdom

// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { createElement } from 'react';

const loggerInfo = vi.fn();
vi.mock('@/utils/logger', () => {
  const logger = { info: (...args) => loggerInfo(...args), debug: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { logger, default: logger };
});

const stableI18n = { getMessage: key => key, lang: 'en' };
vi.mock('@/partials/context/I18nContext', () => ({ useI18n: () => stableI18n }));
vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('@/assets/popup-window/refresh.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('motion/react-m', () => ({
  div: ({ children, animate }) => createElement('div', { 'data-testid': 'update-bar', 'data-animate': animate }, children)
}));

import UpdateComponent from './index.jsx';

const originalReload = browser.runtime.reload;
const originalRequestUpdateCheck = browser.runtime.requestUpdateCheck;

beforeEach(() => {
  vi.clearAllMocks();
  browser.runtime.reload = vi.fn(async () => {});
});

afterEach(() => {
  cleanup();
  browser.runtime.reload = originalReload;
  browser.runtime.requestUpdateCheck = originalRequestUpdateCheck;
});

describe('UpdateComponent — update check', () => {
  it('shows the update bar and logs the result when Chrome resolves the check with an object', async () => {
    browser.runtime.requestUpdateCheck = vi.fn(async () => ({ status: 'update_available', version: '1.8.13' }));

    render(createElement(UpdateComponent));

    await waitFor(() => {
      expect(screen.getByTestId('update-bar').dataset.animate).toBe('visible');
    });
    expect(loggerInfo).toHaveBeenCalledWith(
      LOGGER_CONSTANTS.CATEGORIES.SYSTEM,
      'UpdateComponent - update check result',
      { status: 'update_available', version: '1.8.13' }
    );
  });

  it('keeps the update bar hidden and logs the result when no update is available', async () => {
    browser.runtime.requestUpdateCheck = vi.fn(async () => ({ status: 'no_update' }));

    render(createElement(UpdateComponent));

    await waitFor(() => {
      expect(loggerInfo).toHaveBeenCalledWith(
        LOGGER_CONSTANTS.CATEGORIES.SYSTEM,
        'UpdateComponent - update check result',
        { status: 'no_update', version: null }
      );
    });
    expect(screen.getByTestId('update-bar').dataset.animate).toBe('hidden');
  });

  it('reads the status from the [status, details] array form as well', async () => {
    browser.runtime.requestUpdateCheck = vi.fn(async () => ['update_available', { version: '1.8.13' }]);

    render(createElement(UpdateComponent));

    await waitFor(() => {
      expect(screen.getByTestId('update-bar').dataset.animate).toBe('visible');
    });
    expect(loggerInfo).toHaveBeenCalledWith(
      LOGGER_CONSTANTS.CATEGORIES.SYSTEM,
      'UpdateComponent - update check result',
      { status: 'update_available', version: '1.8.13' }
    );
  });
});

describe('UpdateComponent — update button', () => {
  it('logs the click before reloading the extension', async () => {
    browser.runtime.requestUpdateCheck = vi.fn(async () => ({ status: 'update_available', version: '1.8.13' }));

    render(createElement(UpdateComponent));
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(browser.runtime.reload).toHaveBeenCalled();
    });
    expect(loggerInfo).toHaveBeenCalledWith(LOGGER_CONSTANTS.CATEGORIES.USER_ACTION, 'UpdateComponent - update clicked');

    const clickLogOrder = loggerInfo.mock.invocationCallOrder[
      loggerInfo.mock.calls.findIndex(call => call[1] === 'UpdateComponent - update clicked')
    ];

    expect(clickLogOrder).toBeLessThan(browser.runtime.reload.mock.invocationCallOrder[0]);
  });
});
