// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const checkShareLinkSupport = async () => {
  try {
    const response = await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.CHECK_SHARE_LINK_SUPPORT,
      target: REQUEST_TARGETS.BACKGROUND
    });

    return response?.status === 'ok' && response?.supported === true;
  } catch {
    return false;
  }
};

export default checkShareLinkSupport;
