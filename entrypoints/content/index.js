// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import contentOnMessage from './events/contentOnMessage';
import isCryptoAvailable from '@/partials/functions/isCryptoAvailable';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  all_frames: true,
  match_about_blank: true,
  cssInjectionMode: 'manual',
  registration: 'runtime',
  cssInjectionMode: 'ui',
  async main (ctx) {
    try {
      let handleMessage;
      const emptyFunc = () => {};
      const cryptoAvailable = isCryptoAvailable();

      if (ctx.isTopFrame) {
        const ui = await createShadowRootUi(ctx, {
          position: 'relative',
          mode: 'closed',
          name: 'twofas-pass-content',
          onMount: (container, shadow, shadowHost) => {
            shadowHost.style = 'position: fixed !important; z-index: 2147483647 !important;';
            shadow.children[0].setAttribute('style', 'z-index: 2147483647 !important;');
            shadow.children[0].setAttribute('style', 'pointer-events: none !important;');
            shadow.children[0].getElementsByTagName('body')[0].style = 'margin: 0 !important; padding: 0 !important; overflow: hidden !important;';

            handleMessage = (request, sender, sendResponse) => contentOnMessage(request, sender, sendResponse, ctx.isTopFrame, container, cryptoAvailable);
            browser.runtime.onMessage.addListener(handleMessage);
          }
        });

        ui.mount();
      } else {
        handleMessage = (request, sender, sendResponse) => contentOnMessage(request, sender, sendResponse, ctx.isTopFrame, null, cryptoAvailable);
        browser.runtime.onMessage.addListener(handleMessage);
      }

      window.addEventListener('error', emptyFunc);
      window.addEventListener('unhandledrejection', emptyFunc);

      const removeListeners = () => {
        browser.runtime.onMessage.removeListener(handleMessage);
        window.removeEventListener('error', emptyFunc);
        window.removeEventListener('unhandledrejection', emptyFunc);
      };

      ctx.onInvalidated(removeListeners);
      window.addEventListener('beforeunload', removeListeners, { once: true });
    } catch (e) {
      handleError(e);
    }
  },
});
