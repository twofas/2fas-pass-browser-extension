// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isCryptoAvailable from '@/partials/functions/isCryptoAvailable';
import focusOnMessage from './focus/events/focusOnMessage';
import focusFunc from './focus/functions/focusFunc';
import watchRevealedPasswordInputs from './focus/functions/watchRevealedPasswordInputs';
import ifCtxIsInvalid from '@/partials/contentScript/ifCtxIsInvalid';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  allFrames: true,
  matchAboutBlank: true,
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

      return focusOnMessage(request, sender, sendResponse, focusFuncAction);
    };

    browser.runtime.onMessage.addListener(focusOnMessageHandler);
    window.addEventListener('focus', focusFuncAction);
    window.addEventListener('error', emptyFunc);
    window.addEventListener('unhandledrejection', emptyFunc);

    const stopWatchingRevealedPasswords = watchRevealedPasswordInputs();

    const removeListeners = () => {
      browser.runtime.onMessage.removeListener(focusOnMessageHandler);
      window.removeEventListener('focus', focusFuncAction);
      window.removeEventListener('error', emptyFunc);
      window.removeEventListener('unhandledrejection', emptyFunc);
      stopWatchingRevealedPasswords();
    };

    window.addEventListener('beforeunload', removeListeners, { once: true });
  }
});
