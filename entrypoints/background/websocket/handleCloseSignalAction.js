// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import addNewSessionIdToDevice from './utils/addNewSessionIdToDevice';
import TwoFasWebSocket from '.';
import { CONNECT_VIEWS } from '@/constants';
import setConfigured from '@/partials/sessionStorage/configured/setConfigured';
import wsNotify from './wsNotify.js';

/**
* Handles the close signal action.
* @param {string} newSessionId - The new session ID.
* @param {string} uuid - The unique identifier for the user.
* @param {Object} closeData - The data related to the close action.
* @return {Promise<void>}
*/
const handleCloseSignalAction = async (newSessionId, uuid, closeData) => {
  await addNewSessionIdToDevice(uuid, newSessionId); // FUTURE - Change to deviceId instead of uuid?

  if (closeData?.returnUrl === '/') {
    wsNotify('stateChange', { connectView: CONNECT_VIEWS.DeviceSelect });
    wsNotify('toast', { message: getMessage('connect_push_cancelled'), type: 'info' });
  }

  try {
    const socket = TwoFasWebSocket.getInstance();
    socket.close();
  } catch {}

  if (!closeData?.returnUrl) {
    await setConfigured(Date.now());
    wsNotify('login', {});
  }

  return true;
};

export default handleCloseSignalAction;
