// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isCryptoAvailable from '@/partials/functions/isCryptoAvailable';
import focusOnMessage from './focus/events/focusOnMessage';

// FUTURE - remove listeners
export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  all_frames: true,
  match_about_blank: true,
  registration: 'manifest',
  async main () {
    const cryptoAvailable = isCryptoAvailable();

    browser.runtime.onMessage.addListener(focusOnMessage);

    window.addEventListener('focus', async () => {
      await browser.runtime.sendMessage({
        action: REQUEST_ACTIONS.TAB_FOCUS,
        target: REQUEST_TARGETS.BACKGROUND,
        cryptoAvailable
      });
    });
  }
});
