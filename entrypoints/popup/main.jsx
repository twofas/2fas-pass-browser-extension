// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import 'react-toastify/dist/ReactToastify.css';
import '@/partials/global-styles/global.scss';
import '@/partials/global-styles/toasts.scss';
import '@/partials/global-styles/selects.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup.jsx';
import { HashRouter } from 'react-router';

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Popup />
  </HashRouter>
);
