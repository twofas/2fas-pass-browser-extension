// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import 'react-toastify/dist/ReactToastify.css';
import '@splidejs/react-splide/css/core';
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

/**
 * Pre-hydrates Zustand store and sets initial hash route before React renders.
 * This prevents the flash of ThisTab route before navigating to stored route.
 */
const hydrateAndSetInitialRoute = async () => {
  try {
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

await Promise.all([
  setTheme(),
  hydrateAndSetInitialRoute(),
  initI18n()
]);

preloadInterFontAsync();
createRoot(document.getElementById('root')).render(<Popup />);
