// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import addNewSessionIdToDevice from './utils/addNewSessionIdToDevice';
import TwoFasWebSocket from '@/partials/WebSocket';

/** 
* Handles the close signal action.
* @param {string} newSessionId - The new session ID.
* @param {string} uuid - The unique identifier for the user.
* @param {Object} closeData - The data related to the close action.
* @return {Promise<void>}
*/
const handleCloseSignalAction = async (newSessionId, uuid, closeData) => {
  console.log('Handling close signal action', { newSessionId, uuid, closeData });
  await addNewSessionIdToDevice(uuid, newSessionId); // FUTURE - Change to deviceId instead of uuid?

  if (closeData?.returnUrl === '/') {
    eventBus.emit(eventBus.EVENTS.CONNECT.CANCEL_ACTION);
  }

  try {
    const socket = TwoFasWebSocket.getInstance();
    console.log('Closing WebSocket connection');
    socket.close();
  } catch {}

  if (!closeData?.returnUrl) {
    eventBus.emit(eventBus.EVENTS.CONNECT.LOGIN);
  }

  return true;
};

export default handleCloseSignalAction;
