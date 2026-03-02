// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { wsState } from './wsState.js';

const wsNotify = (updateType, payload) => {
  browser.runtime.sendMessage({
    action: REQUEST_ACTIONS.WS_STATE_UPDATE,
    target: REQUEST_TARGETS.POPUP,
    updateType,
    payload
  }).catch(() => {
    if (updateType === 'toast') {
      wsState.pendingToasts.push(payload);
    }

    if (updateType === 'navigate') {
      wsState.pendingNavigation = payload;
    }
  });
};

export default wsNotify;
