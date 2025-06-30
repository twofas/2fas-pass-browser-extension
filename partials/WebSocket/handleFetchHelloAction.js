// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import TwoFasWebSocket from '@/partials/WebSocket';
import deviceNameUpdate from './utils/deviceNameUpdate';

/** 
* Handles the fetch hello action.
* @param {Object} json - The JSON object containing the hello data.
* @param {string} stateDeviceId - The device ID from the state.
* @param {string} deviceId - The device ID.
* @return {Promise<string>} The device ID of the updated device.
*/
const handleFetchHelloAction = async (json, stateDeviceId, deviceId) => {
  try {
    const { browserName, browserVersion, browserExtName } = await getBeInfo();

    if (!json?.payload?.deviceId || json?.payload?.deviceId.length <= 0) {
      throw new TwoFasError(TwoFasError.errors.helloFetchActionNoDeviceId);
    }

    if (json?.payload?.deviceId !== stateDeviceId && json?.payload?.deviceId !== deviceId) {
      throw new TwoFasError(TwoFasError.errors.helloFetchActionWrongDeviceId);
    }

    await deviceNameUpdate(json.payload);

    const socket = TwoFasWebSocket.getInstance();
    await socket.sendMessage({
      id: json.id,
      action: SOCKET_ACTIONS.HELLO,
      payload: { browserName, browserVersion, browserExtName }
    });
  
    return json.payload.deviceId;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.helloFetchAction, { event: e });
  }
};

export default handleFetchHelloAction;
