// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { createElement } from 'react';

const getCurrentDevice = vi.fn();

vi.mock('@/partials/context/I18nContext', () => ({ useI18n: () => ({ getMessage: key => key }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuthState: () => ({ configured: false }) }));
vi.mock('@/entrypoints/popup/hooks/useScrollPosition', () => ({ default: () => {} }));
vi.mock('@/entrypoints/popup/components/NavigationButton', () => ({ default: () => createElement('div') }));
vi.mock('@/assets/popup-window/disconnect-device.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/partials/functions', () => ({ getCurrentDevice: (...args) => getCurrentDevice(...args) }));
vi.mock('@/entrypoints/popup/components/ConfirmDialog', () => ({
  default: ({ open, onConfirm }) => open
    ? createElement('button', { 'data-testid': 'confirm-remove', onClick: onConfirm })
    : null
}));

import SettingsDevices from './index.jsx';

const FUTURE = btoa(String(Date.now() + 1000 * 60 * 60 * 24));

const paidDevice = () => ({ id: 'd1', name: 'Phone', platform: 'ios', scheme: 2, updatedAt: 2, expirationDate: FUTURE });
const freeDevice = () => ({ id: 'd2', name: 'Tablet', platform: 'android', scheme: 2, updatedAt: 1 });

const removeFirstDevice = async () => {
  render(createElement(SettingsDevices, {}));

  await waitFor(() => expect(screen.getAllByTitle('settings_devices_disconnect_title').length).toBeGreaterThan(0));

  await act(async () => {
    fireEvent.click(screen.getAllByTitle('settings_devices_disconnect_title')[0]);
  });

  await act(async () => {
    fireEvent.click(screen.getByTestId('confirm-remove'));
  });
};

beforeEach(async () => {
  vi.clearAllMocks();
  browser.idle.setDetectionInterval = vi.fn();
  getCurrentDevice.mockRejectedValue(new Error('no current device'));
  await storage.removeItem('local:devices');
  await storage.removeItem('local:autoIdleLock');
});

afterEach(() => {
  cleanup();
});

describe('SettingsDevices — disconnecting the last paid device must not leave a premium-only idle lock', () => {
  it('restores the default idle lock when the removed device was the only paid one', async () => {
    await storage.setItem('local:devices', [paidDevice()]);
    await storage.setItem('local:autoIdleLock', 'default');

    await removeFirstDevice();

    expect(await storage.getItem('local:devices')).toEqual([]);
    expect(await storage.getItem('local:autoIdleLock')).toBe(config.defaultStorageIdleLock);
  });

  it('keeps the "only on restart" choice when a paid device remains', async () => {
    await storage.setItem('local:devices', [paidDevice(), freeDevice()]);
    await storage.setItem('local:autoIdleLock', 'default');

    render(createElement(SettingsDevices, {}));

    await waitFor(() => expect(screen.getAllByTitle('settings_devices_disconnect_title').length).toBe(2));

    await act(async () => {
      fireEvent.click(screen.getAllByTitle('settings_devices_disconnect_title')[1]);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-remove'));
    });

    const devices = await storage.getItem('local:devices');
    expect(devices.map(d => d.id)).toEqual(['d1']);
    expect(await storage.getItem('local:autoIdleLock')).toBe('default');
  });
});
