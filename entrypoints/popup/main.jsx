// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

console.log('🚀 [PERF] main.jsx START at:', performance.now().toFixed(2), 'ms');
window.__POPUP_PERF__ = {
  mainStart: performance.now(),
  markers: []
};

import 'react-toastify/dist/ReactToastify.css';
import '@splidejs/react-splide/css/core';
import '@/partials/global-styles/global.scss';
import '@/partials/global-styles/toasts.scss';
import '@/partials/global-styles/selects.scss';
import '@/partials/global-styles/prime-react.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup.jsx';
import { preloadInterFontAsync } from '@/partials/functions/preloadFonts.js';

console.log('🚀 [PERF] main.jsx imports done at:', performance.now().toFixed(2), 'ms');

// Preload only Inter font for popup
preloadInterFontAsync();

console.log('🚀 [PERF] main.jsx before render at:', performance.now().toFixed(2), 'ms');
createRoot(document.getElementById('root')).render(<Popup />);
console.log('🚀 [PERF] main.jsx render called at:', performance.now().toFixed(2), 'ms');
