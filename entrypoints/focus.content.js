// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isCryptoAvailable from '@/partials/functions/isCryptoAvailable';
import focusOnMessage from './focus/events/focusOnMessage';
import focusFunc from './focus/functions/focusFunc';
import ifCtxIsInvalid from '@/partials/contentScript/ifCtxIsInvalid';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  all_frames: true,
  match_about_blank: true,
  registration: 'manifest',
  async main (ctx) {
    const emptyFunc = () => {};
    const cryptoAvailable = isCryptoAvailable();
    const focusFuncAction = () => {
      if (ifCtxIsInvalid(ctx, removeListeners)) {
        return;
      }

      return focusFunc(cryptoAvailable);
    };

    const focusOnMessageHandler = (request, sender, sendResponse) => {
      if (ifCtxIsInvalid(ctx, removeListeners)) {
        return;
      }

      return focusOnMessage(request, sender, sendResponse);
    };

    browser.runtime.onMessage.addListener(focusOnMessageHandler);
    window.addEventListener('focus', focusFuncAction);
    window.addEventListener('error', emptyFunc);
    window.addEventListener('unhandledrejection', emptyFunc);

    const removeListeners = () => {
      browser.runtime.onMessage.removeListener(focusOnMessageHandler);
      window.removeEventListener('focus', focusFuncAction);
      window.removeEventListener('error', emptyFunc);
      window.removeEventListener('unhandledrejection', emptyFunc);
    };

    window.addEventListener('beforeunload', removeListeners, { once: true });
  }
});
