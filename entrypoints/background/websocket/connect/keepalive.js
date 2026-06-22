// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const KEEPALIVE_ALARM = 'wsConnectKeepalive';
const isSafari = import.meta.env.BROWSER === 'safari';

// Safari terminates the background service worker far more aggressively than Chrome
// and does NOT honour an open WebSocket/port as a keepalive. A 30s alarm does not keep
// the worker resident either — it only WAKES it, at which point the alarm handler
// re-opens the socket to the persisted session (resumeConnectQR). So the alarm is the
// periodic wake that makes resume happen proactively, not a true keepalive. Chrome keeps
// the worker alive via the open popup-lifecycle port, so the alarm is Safari-only.
// 0.5 min (30s) is the minimum honoured interval on both Chrome (>=120) and Safari.
const startKeepalive = async () => {
  if (!isSafari) {
    return;
  }

  try {
    await browser.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.5 });
  } catch {}
};

const stopKeepalive = async () => {
  if (!isSafari) {
    return;
  }

  try {
    await browser.alarms.clear(KEEPALIVE_ALARM);
  } catch {}
};

export { KEEPALIVE_ALARM, startKeepalive, stopKeepalive };
