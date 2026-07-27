// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { wsState } from './wsState.js';

const SELF_TICK_MS = 10000;

let tickID = null;

const startSelfTick = () => {
  if (tickID) {
    return;
  }

  tickID = setInterval(() => {
    if (!wsState.active) {
      stopSelfTick();
      return;
    }

    try {
      browser.runtime.getPlatformInfo().catch(() => {});
    } catch {}
  }, SELF_TICK_MS);
};

const stopSelfTick = () => {
  if (tickID) {
    clearInterval(tickID);
    tickID = null;
  }
};

export { startSelfTick, stopSelfTick };
