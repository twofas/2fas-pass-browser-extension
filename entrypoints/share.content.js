// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import ifCtxIsInvalid from '@/partials/contentScript/ifCtxIsInvalid';
import parseShareHash from '@/entrypoints/share/parseShareHash';
import checkShareLinkSupport from '@/entrypoints/share/checkShareLinkSupport';
import waitForContainer from '@/entrypoints/share/waitForContainer';
import { createButton, removeButton, hasButton } from '@/entrypoints/share/shareButton';

export default defineContentScript({
  matches: [`${import.meta.env.VITE_SHARE_API_URL}/*`],
  allFrames: false,
  registration: 'manifest',
  async main (ctx) {
    await initI18n();

    const emptyFunc = () => {};
    const buttonText = getMessage('share_content_open_in_extension');

    const tryInjectButton = async () => {
      if (ifCtxIsInvalid(ctx, removeListeners)) {
        return;
      }

      removeButton();

      const params = parseShareHash(window.location.hash);

      if (!params) {
        return;
      }

      const supported = await checkShareLinkSupport();

      if (!supported) {
        return;
      }

      const container = await waitForContainer();

      if (!container || hasButton(container)) {
        return;
      }

      const button = createButton(params, buttonText);
      container.appendChild(button);
    };

    const handleHashChange = () => {
      tryInjectButton();
    };

    const handleMessage = (request, _sender, sendResponse) => {
      if (
        request?.target !== REQUEST_TARGETS.SHARE_CONTENT ||
        request?.action !== REQUEST_ACTIONS.SHARE_LINK_STATE_CHANGE
      ) {
        return false;
      }

      if (request.supported) {
        tryInjectButton();
      } else {
        removeButton();
      }

      sendResponse({ status: 'ok' });
      return false;
    };

    const removeListeners = () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('error', emptyFunc);
      window.removeEventListener('unhandledrejection', emptyFunc);
      browser.runtime.onMessage.removeListener(handleMessage);
    };

    browser.runtime.onMessage.addListener(handleMessage);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('error', emptyFunc);
    window.addEventListener('unhandledrejection', emptyFunc);
    window.addEventListener('beforeunload', removeListeners, { once: true });

    await tryInjectButton();
  }
});
