// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import '@/partials/TwofasNotification/TwofasNotification.scss';
import contentOnMessage from './events/contentOnMessage';
import isCryptoAvailable from '@/partials/functions/isCryptoAvailable';
import ifCtxIsInvalid from '@/partials/contentScript/ifCtxIsInvalid';
import setupStyleObserver from './utils/setupStyleObserver';
import topLayerManager from './utils/topLayerManager';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  all_frames: true,
  match_about_blank: true,
  registration: 'runtime',
  cssInjectionMode: 'ui',
  async main (ctx) {
    try {
      await initI18n();

      let handleMessage;
      let topLayerCleanup = null;
      const emptyFunc = () => {};
      const cryptoAvailable = isCryptoAvailable();

      const removeListeners = () => {
        browser.runtime.onMessage.removeListener(handleMessage);
        window.removeEventListener('error', emptyFunc);
        window.removeEventListener('unhandledrejection', emptyFunc);

        if (topLayerCleanup) {
          topLayerCleanup();
          topLayerCleanup = null;
        }
      };

      if (ctx?.isTopFrame && ctx?.isValid) {
        const ui = await createShadowRootUi(ctx, {
          position: 'relative',
          mode: 'closed',
          name: 'twofas-pass-content',
          onMount: (container, shadow, shadowHost) => {
            const standardStyles = 'position: fixed !important; z-index: 2147483647 !important;';
            shadowHost.style = standardStyles;
            shadow.children[0].setAttribute('style', 'z-index: 2147483647 !important;');
            shadow.children[0].setAttribute('style', 'pointer-events: none !important;');
            shadow.children[0].getElementsByTagName('body')[0].style = 'margin: 0 !important; padding: 0 !important; overflow: hidden !important;';

            const styleObserver = setupStyleObserver(shadowHost, standardStyles);

            const topLayer = topLayerManager(
              shadowHost,
              styleObserver.disconnect,
              styleObserver.reconnect
            );

            topLayerCleanup = topLayer.cleanup;

            handleMessage = (request, sender, sendResponse) => {
              if (ifCtxIsInvalid(ctx, removeListeners)) {
                return;
              }

              return contentOnMessage(request, sender, sendResponse, ctx.isTopFrame, container, cryptoAvailable);
            };

            browser.runtime.onMessage.addListener(handleMessage);
          }
        });

        ui.mount();
      } else {
        handleMessage = (request, sender, sendResponse) => {
          if (ifCtxIsInvalid(ctx, removeListeners)) {
            return;
          }

          return contentOnMessage(request, sender, sendResponse, ctx.isTopFrame, null, cryptoAvailable);
        };

        browser.runtime.onMessage.addListener(handleMessage);
      }

      window.addEventListener('error', emptyFunc);
      window.addEventListener('unhandledrejection', emptyFunc);
      window.addEventListener('beforeunload', removeListeners, { once: true });
    } catch (e) {
      handleError(e);
    }
  },
});
