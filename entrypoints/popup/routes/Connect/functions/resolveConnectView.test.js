// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import CONNECT_VIEWS from '@/constants/CONNECT_VIEWS.js';
import resolveConnectView from './resolveConnectView.js';

describe('resolveConnectView — no QR/new-device flash before saved devices load', () => {
  it('returns null while the device list is still loading (default DeviceSelect, not loaded)', () => {
    expect(resolveConnectView({ rawConnectView: null, devicesLoaded: false, readyDevicesCount: 0 })).toBe(null);
  });

  it('shows the saved device list once loaded when devices exist', () => {
    expect(resolveConnectView({ rawConnectView: null, devicesLoaded: true, readyDevicesCount: 2 })).toBe(CONNECT_VIEWS.DeviceSelect);
  });

  it('shows the new-device screen once loaded when there are no saved devices', () => {
    expect(resolveConnectView({ rawConnectView: null, devicesLoaded: true, readyDevicesCount: 0 })).toBe(CONNECT_VIEWS.DeviceNew);
  });

  it('honors an active background QR session immediately, without waiting for the device load', () => {
    expect(resolveConnectView({ rawConnectView: CONNECT_VIEWS.QrView, devicesLoaded: false, readyDevicesCount: 0 })).toBe(CONNECT_VIEWS.QrView);
  });

  it('honors an active background Progress / PushSent view immediately', () => {
    expect(resolveConnectView({ rawConnectView: CONNECT_VIEWS.Progress, devicesLoaded: false, readyDevicesCount: 5 })).toBe(CONNECT_VIEWS.Progress);
    expect(resolveConnectView({ rawConnectView: CONNECT_VIEWS.PushSent, devicesLoaded: false, readyDevicesCount: 5 })).toBe(CONNECT_VIEWS.PushSent);
  });

  it('does not flash the new-device screen before load even when DeviceSelect is requested explicitly', () => {
    expect(resolveConnectView({ rawConnectView: CONNECT_VIEWS.DeviceSelect, devicesLoaded: false, readyDevicesCount: 0 })).toBe(null);
  });

  it('never collapses to null once devices have loaded (explicit DeviceSelect with no devices falls back to DeviceNew)', () => {
    expect(resolveConnectView({ rawConnectView: CONNECT_VIEWS.DeviceSelect, devicesLoaded: true, readyDevicesCount: 0 })).toBe(CONNECT_VIEWS.DeviceNew);
  });
});
