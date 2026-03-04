// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import 'react-toastify/dist/ReactToastify.css';
import '@/partials/global-styles/global.scss';
import '@/partials/global-styles/toasts.scss';
import '@/partials/global-styles/selects.scss';
import '@/partials/global-styles/prime-react.scss';
import { createRoot } from 'react-dom/client';
import Popup from './Popup.jsx';
import { preloadInterFontAsync } from '@/partials/functions/preloadFonts.js';
import setTheme from './utils/setTheme.js';
import usePopupStateStore from './store/popupState/index.js';

const EXCLUDED_ROUTES = ['/connect', '/', '/fetch', '/blocked'];

const checkActiveWsAction = async () => {
  try {
    const response = await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.WS_GET_STATE,
      target: REQUEST_TARGETS.BACKGROUND_WS
    });

    if (response?.state?.active) {
      let activeHash;

      if (response.state.type === 'connect_qr' || response.state.type === 'connect_push') {
        activeHash = '#/connect';
      } else if (response.state.type === 'fetch') {
        activeHash = '#/fetch';
      }

      const requestedHash = window.location.hash;
      const isRouteConflict = activeHash && requestedHash && !requestedHash.startsWith(activeHash);

      if (isRouteConflict) {
        const pendingUpdates = response.pendingUpdates || { toasts: [], navigation: null };
        pendingUpdates.toasts = pendingUpdates.toasts || [];
        pendingUpdates.toasts.push({ message: getMessage('ws_action_in_progress'), type: 'info' });
        response.pendingUpdates = pendingUpdates;
      }

      if (activeHash) {
        window.location.hash = activeHash;
      }

      window.__wsInitialState = response.state;
      window.__wsPendingUpdates = response.pendingUpdates;
      return true;
    } else if (response?.pendingUpdates?.toasts?.length > 0 || response?.pendingUpdates?.navigation) {
      window.__wsPendingUpdates = response.pendingUpdates;
    }
  } catch { }

  return false;
};

/**
 * Pre-hydrates Zustand store and sets initial hash route before React renders.
 * This prevents the flash of ThisTab route before navigating to stored route.
 */
const hydrateAndSetInitialRoute = async () => {
  try {
    if (window.__wsPendingUpdates?.navigation?.path) {
      window.location.hash = `#${window.__wsPendingUpdates.navigation.path}`;
      return;
    }

    await usePopupStateStore.persist.rehydrate();

    const state = usePopupStateStore.getState();
    const hrefArray = state.href;
    const lastHref = hrefArray.length > 0 ? hrefArray[hrefArray.length - 1] : null;

    if (lastHref && !EXCLUDED_ROUTES.includes(lastHref) && !lastHref.startsWith('/fetch/')) {
      const currentHash = window.location.hash;

      if (currentHash === '' || currentHash === '#' || currentHash === '#/') {
        window.location.hash = `#${lastHref}`;
      }
    }
  } catch (e) {
    CatchError(e);
  }
};

browser.runtime.connect({ name: 'popup-lifecycle' });

const wsActive = await checkActiveWsAction();

await Promise.all([
  setTheme(),
  wsActive ? Promise.resolve() : hydrateAndSetInitialRoute(),
  initI18n()
]);

preloadInterFontAsync();
createRoot(document.getElementById('root')).render(<Popup />);
