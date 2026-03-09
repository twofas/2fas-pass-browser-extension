// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const wsState = {
  type: null,
  active: false,

  connectView: null,
  progress: 264,
  deviceName: null,
  socketError: false,
  qrData: null,

  fetchState: null,
  fetchErrorText: null,
  fetchAction: null,
  fetchLocationState: null,

  pendingToasts: [],
  pendingNavigation: null,

  _ephemeralData: null,
  _socketData: {},
  _abortController: null,
};

const getPublicState = () => ({
  type: wsState.type,
  active: wsState.active,
  connectView: wsState.connectView,
  progress: wsState.progress,
  deviceName: wsState.deviceName,
  socketError: wsState.socketError,
  qrData: wsState.qrData,
  fetchState: wsState.fetchState,
  fetchErrorText: wsState.fetchErrorText,
  fetchAction: wsState.fetchAction,
  fetchLocationState: wsState.fetchLocationState,
});

const resetState = () => {
  wsState.type = null;
  wsState.active = false;
  wsState.connectView = null;
  wsState.progress = 264;
  wsState.deviceName = null;
  wsState.socketError = false;
  wsState.qrData = null;
  wsState.fetchState = null;
  wsState.fetchErrorText = null;
  wsState.fetchAction = null;
  wsState.fetchLocationState = null;
  wsState.pendingToasts = [];
  wsState.pendingNavigation = null;
  wsState._ephemeralData = null;
  wsState._socketData = {};
  wsState._abortController = null;
};

const consumePendingUpdates = () => {
  const updates = {
    toasts: [...wsState.pendingToasts],
    navigation: wsState.pendingNavigation,
  };

  wsState.pendingToasts = [];
  wsState.pendingNavigation = null;

  return updates;
};

export { wsState, getPublicState, resetState, consumePendingUpdates };
