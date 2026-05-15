// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export const writeLogViaMessage = async entry => {
  try {
    await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.LOG_EVENT,
      target: REQUEST_TARGETS.BACKGROUND,
      payload: entry
    });
  } catch {}
};
