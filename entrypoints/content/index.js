// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import '@/partials/TwofasNotification/TwofasNotification.scss';
import contentOnMessage from './events/contentOnMessage';
import isCryptoAvailable from '@/partials/functions/isCryptoAvailable';
import ifCtxIsInvalid from '@/partials/contentScript/ifCtxIsInvalid';
import isTopFrame from '@/partials/functions/isTopFrame';
import setupStyleObserver from './utils/setupStyleObserver';
import topLayerManager from './utils/topLayerManager';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  allFrames: true,
  matchAboutBlank: true,
  registration: 'runtime',
  cssInjectionMode: 'ui',
  async main (ctx) {
    try {
      // Only the top frame renders localized text — every i18n-using handler
      // (notification, matching-logins, save prompt, cross-domain dialog) is top-frame
      // -only. Sub-frames / iframes never use i18n, so they skip the initI18n()
      // service-worker round-trip entirely and register their message listener below
      // immediately; this is what stops the autofill injection-verification loop from
      // stalling while it waits on tracker iframes to become responsive. The top frame
      // kicks initI18n() off WITHOUT awaiting (fire-and-forget) so its listener is not
      // gated on the SW either; the text-rendering handlers await i18n themselves
      // (see I18N_DEPENDENT_ACTIONS in contentOnMessage).
      if (isTopFrame()) {
        initI18n();
      }

      logger.debug(LOGGER_CONSTANTS.CATEGORIES.CONTENT, 'ContentScript - main initialized', {
        topFrame: isTopFrame()
      });

      let handleMessage;
      let topLayerCleanup = null;
      let styleObserverCleanup = null;
      let handleVisibilityChange = null;
      const emptyFunc = () => {};
      const cryptoAvailable = isCryptoAvailable();

      const removeListeners = () => {
        browser.runtime.onMessage.removeListener(handleMessage);
        window.removeEventListener('error', emptyFunc);
        window.removeEventListener('unhandledrejection', emptyFunc);

        if (handleVisibilityChange) {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          handleVisibilityChange = null;
        }

        if (topLayerCleanup) {
          topLayerCleanup();
          topLayerCleanup = null;
        }

        if (styleObserverCleanup) {
          styleObserverCleanup();
          styleObserverCleanup = null;
        }
      };

      if (isTopFrame() && ctx?.isValid && document.body) {
        const ui = await createShadowRootUi(ctx, {
          position: 'relative',
          mode: import.meta.env.DEV ? 'open' : 'closed', // Closed in production (encapsulation). Open ONLY in DEV builds so the autofill E2E harness (Playwright) can pierce the shadow root to drive UI it must interact with — e.g. accepting the cross-domain trust dialog. Production builds are byte-identical to before (import.meta.env.DEV is false → 'closed').
          name: 'twofas-pass-content',
          onMount: (container, shadow, shadowHost) => {
            const standardStyles = 'position: fixed !important; z-index: 2147483647 !important;';
            shadowHost.style = standardStyles;
            shadow.children[0].setAttribute('style', 'z-index: 2147483647 !important;');
            shadow.children[0].setAttribute('style', 'pointer-events: none !important;');
            shadow.children[0].getElementsByTagName('body')[0].style = 'margin: 0 !important; padding: 0 !important; overflow: hidden !important;';

            const styleObserver = setupStyleObserver(shadowHost, standardStyles);

            styleObserverCleanup = styleObserver.disconnect;

            const topLayer = topLayerManager(
              shadowHost,
              styleObserver.disconnect,
              styleObserver.reconnect
            );

            topLayerCleanup = topLayer.cleanup;

            // The top-layer manager watches the whole document subtree; suspend it while the
            // tab is hidden and re-sync on return. setupStyleObserver stays on — it is a
            // cheap single-element anti-tamper control. Pause immediately when the frame
            // mounts hidden (e.g. a background-opened tab).
            handleVisibilityChange = () => {
              if (document.hidden) {
                topLayer.pause();
              } else {
                topLayer.resume();
              }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            if (document.hidden) {
              topLayer.pause();
            }

            handleMessage = (request, sender, sendResponse) => {
              if (ifCtxIsInvalid(ctx, removeListeners)) {
                return;
              }

              return contentOnMessage(request, sender, sendResponse, isTopFrame(), container, cryptoAvailable);
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

          return contentOnMessage(request, sender, sendResponse, isTopFrame(), null, cryptoAvailable);
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
