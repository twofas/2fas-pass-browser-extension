// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createRoot } from 'react-dom/client';
import Install from './Install.jsx';
import { preloadAllFontsAsync } from '@/partials/functions/preloadFonts.js';

// Preload both Inter and Montserrat fonts for install page
preloadAllFontsAsync();

createRoot(document.getElementById('root')).render(
  <Install />
);
