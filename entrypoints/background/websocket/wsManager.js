// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import TwoFasWebSocket from '.';
import generateSessionKeysNonces from './connect/generateSessionKeysNonces.js';
import generateEphemeralKeys from './connect/generateEphemeralKeys.js';
import generateSessionID from './connect/generateSessionID.js';
import calculateConnectSignature from './connect/calculateConnectSignature.js';
import generateQRData from './connect/generateQRData.js';
import calculateFetchSignature from './fetch/calculateFetchSignature.js';
import { getCurrentDevice, sendPush, getNTPTime, networkTest, deletePush } from '@/partials/functions';
import { PULL_REQUEST_TYPES, SOCKET_PATHS, CONNECT_VIEWS } from '@/constants';
import { wsState, getPublicState, resetState } from './wsState.js';
import wsNotify from './wsNotify.js';
import bgConnectOnMessage from './handlers/bgConnectOnMessage.js';
import bgConnectOnClose from './handlers/bgConnectOnClose.js';
import bgFetchOnMessage from './handlers/bgFetchOnMessage.js';
import bgFetchOnClose from './handlers/bgFetchOnClose.js';

const closeExistingSocket = () => {
  try {
    const socket = TwoFasWebSocket.getInstance();

    if (socket && socket.socket.readyState !== WebSocket.CLOSED) {
      socket.close(WEBSOCKET_STATES.NORMAL_CLOSURE, 'New action requested');
    }
  } catch {
    // No instance exists
  }
};

const createSocket = async (sessionId, onMessage, onClose, messageData) => {
  let socket;
  let socketCreated = false;

  for (let i = 0; i < 5; i++) {
    try {
      socket = new TwoFasWebSocket(sessionId);
      socketCreated = true;
      break;
    } catch (e) {
      if (e?.name === 'TwoFasError' && e?.code === 9041) {
        closeExistingSocket();
      }

      if (i < 4) {
        await new Promise(res => setTimeout(res, 250));
      }
    }
  }

  if (!socketCreated) {
    return null;
  }

  socket.open();
  socket.addEventListener('message', onMessage, messageData);
  socket.addEventListener('close', onClose, messageData);

  return socket;
};

const startConnectQR = async () => {
  if (wsState.active) {
    return { status: 'busy', state: getPublicState() };
  }

  resetState();
  wsState.type = 'connect_qr';
  wsState.active = true;
  wsState.connectView = CONNECT_VIEWS.QrView;

  try {
    await generateSessionKeysNonces();
    wsState._ephemeralData = await generateEphemeralKeys();
  } catch (e) {
    resetState();
    await CatchError(e);
    return { status: 'error', message: getMessage('error_general') };
  }

  let sessionID, signature, qrData;

  try {
    sessionID = await generateSessionID();
    signature = await calculateConnectSignature(wsState._ephemeralData.publicKey, sessionID);
    qrData = await generateQRData(wsState._ephemeralData.publicKey, sessionID, signature);
  } catch (e) {
    resetState();
    await CatchError(e);
    return { status: 'error', message: getMessage('error_general') };
  }

  wsState.qrData = qrData;
  wsState._socketData = {
    uuid: wsState._ephemeralData.uuid,
    path: SOCKET_PATHS.CONNECT.QR,
  };

  const socket = await createSocket(sessionID, bgConnectOnMessage, bgConnectOnClose, wsState._socketData);

  if (!socket) {
    resetState();
    return { status: 'error', message: getMessage('error_general') };
  }

  wsNotify('stateChange', { active: true });

  return { status: 'ok', state: getPublicState() };
};

const startConnectPush = async deviceId => {
  if (wsState.active) {
    return { status: 'busy', state: getPublicState() };
  }

  resetState();
  wsState.type = 'connect_push';
  wsState.active = true;
  wsState.connectView = CONNECT_VIEWS.PushSent;

  const devices = await storage.getItem('local:devices') || [];
  const device = devices.find(d => d.id === deviceId);

  if (!device) {
    resetState();
    return { status: 'error', message: getMessage('error_general') };
  }

  wsState.deviceName = device?.name || null;

  wsNotify('stateChange', { active: true, connectView: wsState.connectView, deviceName: wsState.deviceName });

  try {
    await generateSessionKeysNonces();
    wsState._ephemeralData = await generateEphemeralKeys();
  } catch (e) {
    resetState();
    wsNotify('stateChange', { active: false });
    await CatchError(e);
    return { status: 'error', message: getMessage('error_general') };
  }

  device.uuid = wsState._ephemeralData.uuid;

  let sessionId, timestamp, sigPush;

  try {
    sessionId = Base64ToHex(device?.sessionId).toLowerCase();
    const timestampValue = await getNTPTime();
    timestamp = timestampValue.toString();
    sigPush = await calculateFetchSignature(sessionId, device?.id, device?.uuid, timestamp);
  } catch (e) {
    resetState();
    wsNotify('stateChange', { active: false });
    await CatchError(e);
    return { status: 'error', message: getMessage('error_general') };
  }

  wsState._socketData = {
    uuid: device.uuid,
    action: PULL_REQUEST_TYPES.FULL_SYNC,
    path: SOCKET_PATHS.CONNECT.PUSH,
  };

  const socket = await createSocket(sessionId, bgConnectOnMessage, bgConnectOnClose, wsState._socketData);

  if (!socket) {
    resetState();
    wsNotify('stateChange', { active: false });
    return { status: 'error', message: getMessage('error_general') };
  }

  try {
    await socket.waitForOpen();

    const json = await sendPush(device, { timestamp, sigPush, messageType: 'be_request' });

    if (json?.error === 'UNREGISTERED') {
      cancelCurrentAction();
      return { status: 'error', message: getMessage('fetch_token_unregistered_header') };
    }
  } catch (e) {
    cancelCurrentAction();
    const toastMessage = await networkTest('error_general');
    await CatchError(e);
    return { status: 'error', message: getMessage(toastMessage) };
  }

  return { status: 'ok', state: getPublicState() };
};

const startFetch = async (fetchAction, fetchData, from) => {
  if (wsState.active) {
    return { status: 'busy', state: getPublicState() };
  }

  resetState();
  wsState.type = 'fetch';
  wsState.active = true;
  wsState.fetchAction = fetchAction;
  wsState.fetchLocationState = { action: fetchAction, data: fetchData, from };

  if (fetchAction === PULL_REQUEST_TYPES.UPDATE_DATA) {
    wsState.fetchState = 3; // FETCH_STATE.CONTINUE_UPDATE
  } else {
    wsState.fetchState = 0; // FETCH_STATE.PUSH_NOTIFICATION
  }

  wsNotify('stateChange', { active: true, fetchState: wsState.fetchState, fetchAction: wsState.fetchAction });

  let device, sessionId, timestamp, sigPush;

  try {
    device = await getCurrentDevice(fetchData?.deviceId || null);

    if (!device?.sessionId || !device?.id || !device?.uuid) {
      wsState.fetchState = 1; // FETCH_STATE.CONNECTION_ERROR
      wsState.fetchErrorText = getMessage('error_general');
      wsNotify('stateChange', { active: true, fetchState: wsState.fetchState, fetchErrorText: wsState.fetchErrorText });
      return { status: 'ok', state: getPublicState() };
    }

    sessionId = Base64ToHex(device?.sessionId).toLowerCase();
    const timestampValue = await getNTPTime();
    timestamp = timestampValue.toString();
    sigPush = await calculateFetchSignature(sessionId, device?.id, device?.uuid, timestamp);
  } catch (e) {
    wsState.fetchState = 1; // FETCH_STATE.CONNECTION_ERROR
    wsState.fetchErrorText = getMessage('error_general');
    await CatchError(e);
    wsNotify('stateChange', { active: true, fetchState: wsState.fetchState, fetchErrorText: wsState.fetchErrorText });
    return { status: 'ok', state: getPublicState() };
  }

  wsState._socketData = {
    state: wsState.fetchLocationState,
    device,
  };

  const socket = await createSocket(sessionId, bgFetchOnMessage, bgFetchOnClose, wsState._socketData);

  if (!socket) {
    wsState.fetchState = 1; // FETCH_STATE.CONNECTION_ERROR
    wsState.fetchErrorText = getMessage('error_general');
    wsNotify('stateChange', { active: true, fetchState: wsState.fetchState, fetchErrorText: wsState.fetchErrorText });
    return { status: 'ok', state: getPublicState() };
  }

  try {
    await socket.waitForOpen();
  } catch (e) {
    wsState.fetchState = 1; // FETCH_STATE.CONNECTION_ERROR
    wsState.fetchErrorText = getMessage('error_general');
    await CatchError(e);
    wsNotify('stateChange', { active: true, fetchState: wsState.fetchState, fetchErrorText: wsState.fetchErrorText });
    return { status: 'ok', state: getPublicState() };
  }

  try {
    const json = await sendPush(device, { timestamp, sigPush, messageType: 'be_request' });
    wsState.fetchLocationState.data = wsState.fetchLocationState.data || {};
    wsState.fetchLocationState.data.notificationId = json?.notificationId;
    wsState._socketData.state = wsState.fetchLocationState;

    if (json?.error === 'UNREGISTERED') {
      cancelCurrentAction();
      wsState.fetchState = 1;
      wsState.fetchErrorText = getMessage('fetch_token_unregistered_header');
      wsNotify('stateChange', { active: true, fetchState: wsState.fetchState, fetchErrorText: wsState.fetchErrorText });
      return { status: 'ok', state: getPublicState() };
    }
  } catch (e) {
    cancelCurrentAction();
    wsState.fetchState = 1;
    wsState.fetchErrorText = getMessage('error_general');
    await CatchError(e);
    wsNotify('stateChange', { active: true, fetchState: wsState.fetchState, fetchErrorText: wsState.fetchErrorText });
    return { status: 'ok', state: getPublicState() };
  }

  return { status: 'ok', state: getPublicState() };
};

const cancelCurrentAction = async () => {
  const currentType = wsState.type;

  if (currentType === 'fetch') {
    try {
      const device = wsState._socketData?.device;
      const notificationId = wsState.fetchLocationState?.data?.notificationId;

      if (device?.id && notificationId) {
        await deletePush(device.id, notificationId);
      }
    } catch { }
  }

  closeExistingSocket();
  resetState();
  wsNotify('stateChange', { active: false });

  return { status: 'ok' };
};

const reloadConnectQR = async () => {
  if (wsState.active && wsState.type !== 'connect_qr') {
    return { status: 'busy', state: getPublicState() };
  }

  closeExistingSocket();

  const prevEphemeralData = wsState._ephemeralData;

  resetState();
  wsState.type = 'connect_qr';
  wsState.active = true;
  wsState.connectView = CONNECT_VIEWS.QrView;

  try {
    if (!prevEphemeralData) {
      await generateSessionKeysNonces();
      wsState._ephemeralData = await generateEphemeralKeys();
    } else {
      wsState._ephemeralData = prevEphemeralData;
    }
  } catch (e) {
    resetState();
    await CatchError(e);
    return { status: 'error', message: getMessage('error_general') };
  }

  let sessionID, signature, qrData;

  try {
    sessionID = await generateSessionID();
    signature = await calculateConnectSignature(wsState._ephemeralData.publicKey, sessionID);
    qrData = await generateQRData(wsState._ephemeralData.publicKey, sessionID, signature);
  } catch (e) {
    resetState();
    await CatchError(e);
    return { status: 'error', message: getMessage('error_general') };
  }

  wsState.qrData = qrData;
  wsState._socketData = {
    uuid: wsState._ephemeralData.uuid,
    path: SOCKET_PATHS.CONNECT.QR,
  };

  const socket = await createSocket(sessionID, bgConnectOnMessage, bgConnectOnClose, wsState._socketData);

  if (!socket) {
    resetState();
    return { status: 'error', message: getMessage('error_general') };
  }

  wsNotify('stateChange', { active: true, socketError: false });

  return { status: 'ok', state: getPublicState() };
};

const getActiveRoute = () => {
  if (!wsState.active) {
    return null;
  }

  if (wsState.type === 'connect_qr' || wsState.type === 'connect_push') {
    return '/connect';
  }

  if (wsState.type === 'fetch') {
    return '/fetch';
  }

  return null;
};

export {
  startConnectQR,
  startConnectPush,
  startFetch,
  cancelCurrentAction,
  reloadConnectQR,
  getPublicState,
  getActiveRoute,
};
