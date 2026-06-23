// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const TAB_FOCUS_DEDUPE_MS = 500;
const lastFocusByTab = new Map();

/**
* Deduplicates TAB_FOCUS events. The focus content script runs in every frame (all_frames: true),
* so a single window focus can emit one TAB_FOCUS message per frame and trigger a full getItems()
* vault deserialization per frame. This gate lets only the first focus per tab within
* TAB_FOCUS_DEDUPE_MS through, collapsing the burst into a single handling. It stores only tab ids
* and timestamps - never any vault data - so no sensitive material is retained in memory.
* @param {number} tabId - The id of the focused tab.
* @param {number} [now] - The current time in milliseconds (injectable for testing).
* @return {boolean} True if this focus event should be handled, false if it is a recent duplicate.
*/
const shouldHandleTabFocus = (tabId, now = Date.now()) => {
  if (typeof tabId !== 'number') {
    return true;
  }

  for (const [id, timestamp] of lastFocusByTab) {
    if (now - timestamp >= TAB_FOCUS_DEDUPE_MS) {
      lastFocusByTab.delete(id);
    }
  }

  const last = lastFocusByTab.get(tabId);

  if (typeof last === 'number' && now - last < TAB_FOCUS_DEDUPE_MS) {
    return false;
  }

  lastFocusByTab.set(tabId, now);
  return true;
};

export default shouldHandleTabFocus;
