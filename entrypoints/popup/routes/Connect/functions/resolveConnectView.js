// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import CONNECT_VIEWS from '@/constants/CONNECT_VIEWS.js';

/**
* Resolves which Connect sub-view should be displayed.
*
* The saved device list (`local:devices`) loads asynchronously, so `readyDevicesCount`
* starts at 0 before the first load resolves. Returning DeviceNew during that window made
* the empty "connect a new device" screen flash for a frame before the user's saved devices
* appeared. While the default DeviceSelect is being resolved but the list has not loaded yet,
* this returns null so every Connect section stays hidden (they all start `initial="hidden"`),
* avoiding the flash. An active background view (QrView / Progress / PushSent) is always
* honored immediately and is never gated on the device load.
* @param {Object} params - The resolution inputs.
* @param {string|null} params.rawConnectView - The view from the active background WS session or local state, if any.
* @param {boolean} params.devicesLoaded - Whether the saved device list has finished its first load.
* @param {number} params.readyDevicesCount - Number of ready saved devices.
* @return {string|null} The resolved CONNECT_VIEWS value, or null when nothing should be shown yet.
*/
const resolveConnectView = ({ rawConnectView, devicesLoaded, readyDevicesCount }) => {
  const resolved = rawConnectView || CONNECT_VIEWS.DeviceSelect;

  if (resolved !== CONNECT_VIEWS.DeviceSelect) {
    return resolved;
  }

  if (!devicesLoaded) {
    return null;
  }

  return readyDevicesCount === 0 ? CONNECT_VIEWS.DeviceNew : CONNECT_VIEWS.DeviceSelect;
};

export default resolveConnectView;
