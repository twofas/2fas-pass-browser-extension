// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import deviceUpdate from './utils/deviceUpdate';
import TwoFasWebSocket from '@/partials/WebSocket';

/** 
* Handles the hello action.
* @async
* @param {Object} json - The JSON object containing the hello data.
* @param {string} uuid - The unique identifier for the user.
* @return {Promise<string>} The device ID of the updated device.
*/
const handleHelloAction = async (json, uuid) => {
  const { browserName, browserVersion, browserExtName } = await getBeInfo();
  
  try {
    const deviceId = await deviceUpdate(uuid, json.payload);

    const socket = TwoFasWebSocket.getInstance();
    await socket.sendMessage({
      id: json.id,
      action: SOCKET_ACTIONS.HELLO,
      payload: { browserName, browserVersion, browserExtName }
    });
  
    return deviceId;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.helloAction, { event: e });
  }
};

export default handleHelloAction;
