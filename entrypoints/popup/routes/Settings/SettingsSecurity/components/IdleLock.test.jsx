// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { createElement } from 'react';

const isPaidDeviceConnected = vi.fn();
const CatchErrorMock = vi.fn();

vi.mock('@/utils/CatchError.js', () => ({ default: (...args) => CatchErrorMock(...args) }));
vi.mock('@/partials/functions/isPaidDeviceConnected', () => ({ default: (...args) => isPaidDeviceConnected(...args) }));
vi.mock('@/partials/functions/setIdleInterval', () => ({ default: vi.fn() }));
vi.mock('@/partials/context/I18nContext', () => ({ useI18n: () => ({ getMessage: key => key }) }));
vi.mock('@/assets/popup-window/premium-lock.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/entrypoints/popup/components/Tooltip', () => ({ default: () => createElement('div') }));
vi.mock('@/partials/components/AdvancedSelect', () => ({
  default: ({ options, defaultValue, disabled }) => createElement(
    'select',
    { 'data-testid': 'idle-lock-select', 'data-selected': String(defaultValue?.value), disabled: disabled === 'disabled' },
    options.map(o => createElement('option', { key: String(o.value), value: String(o.value), disabled: o.isDisabled }, String(o.value)))
  )
}));

import IdleLock from './IdleLock';

beforeEach(async () => {
  vi.clearAllMocks();
  isPaidDeviceConnected.mockResolvedValue(false);
  await storage.removeItem('local:autoIdleLock');
});

afterEach(() => {
  cleanup();
});

describe('IdleLock — the section must survive a failing premium or settings lookup', () => {
  it('still renders the select when reading the stored idle lock rejects', async () => {
    const getItem = vi.spyOn(storage, 'getItem').mockRejectedValue(new Error('storage unavailable'));

    render(createElement(IdleLock));

    await waitFor(() => expect(screen.getByTestId('idle-lock-select')).toBeTruthy());
    expect(screen.getByTestId('idle-lock-select').getAttribute('data-selected')).toBe(String(config.defaultStorageIdleLock));
    expect(CatchErrorMock).toHaveBeenCalled();

    getItem.mockRestore();
  });

  it('still renders the select when the premium check rejects', async () => {
    isPaidDeviceConnected.mockRejectedValue(new Error('devices unreadable'));
    await storage.setItem('local:autoIdleLock', 5);

    render(createElement(IdleLock));

    await waitFor(() => expect(screen.getByTestId('idle-lock-select')).toBeTruthy());
    expect(screen.getByTestId('idle-lock-select').getAttribute('data-selected')).toBe('5');
    expect(CatchErrorMock).toHaveBeenCalled();
  });
});

describe('IdleLock — premium status drives the "only on restart" option', () => {
  it('disables the default option for a free user', async () => {
    await storage.setItem('local:autoIdleLock', 15);

    render(createElement(IdleLock));

    await waitFor(() => expect(screen.getByTestId('idle-lock-select')).toBeTruthy());
    expect(screen.getByRole('option', { name: 'default' }).disabled).toBe(true);
    expect(CatchErrorMock).not.toHaveBeenCalled();
  });

  it('enables the default option for a paid user', async () => {
    isPaidDeviceConnected.mockResolvedValue(true);
    await storage.setItem('local:autoIdleLock', 'default');

    render(createElement(IdleLock));

    await waitFor(() => expect(screen.getByTestId('idle-lock-select')).toBeTruthy());
    expect(screen.getByRole('option', { name: 'default' }).disabled).toBe(false);
  });
});
