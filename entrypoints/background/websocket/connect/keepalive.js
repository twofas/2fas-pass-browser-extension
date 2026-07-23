// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const KEEPALIVE_ALARM = 'wsConnectKeepalive';

// The background service worker can be terminated by the browser at any time.
// This alarm acts as a periodic session-resume wake: when triggered, the alarm
// handler re-opens the socket to the persisted session (resumeWsSession). This
// makes session resumption happen proactively rather than waiting for user
// interaction. The alarm is harmless on Chrome where the service worker usually
// stays alive due to open ports; on Safari it's essential for recovery.
// 0.5 min (30s) is the minimum honoured interval on both Chrome (>=120) and Safari.
const startKeepalive = async () => {
  try {
    await browser.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.5 });
  } catch {}
};

const stopKeepalive = async () => {
  try {
    await browser.alarms.clear(KEEPALIVE_ALARM);
  } catch {}
};

export { KEEPALIVE_ALARM, startKeepalive, stopKeepalive };
