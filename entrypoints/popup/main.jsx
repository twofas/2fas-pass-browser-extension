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
import bootstrapPopup from './utils/bootstrapPopup.js';

try {
  browser.runtime.connect({ name: 'popup-lifecycle' });
} catch (e) {
  CatchError(e);
}

await bootstrapPopup();

preloadInterFontAsync();

try {
  logger.info(LOGGER_CONSTANTS.CATEGORIES.SYSTEM, 'Popup - opened', {
    isSeparateWindow: window.location.search.includes('separate'),
    initialHash: window.location.hash || ''
  });
} catch {}

createRoot(document.getElementById('root')).render(<Popup />);
