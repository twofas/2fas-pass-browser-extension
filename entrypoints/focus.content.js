// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  all_frames: true,
  match_about_blank: true,
  registration: 'manifest',
  async main () {
    window.addEventListener('focus', async () => {
      await browser.runtime.sendMessage({
        action: REQUEST_ACTIONS.TAB_FOCUS,
        target: REQUEST_TARGETS.BACKGROUND
      });
    });
  }
});
