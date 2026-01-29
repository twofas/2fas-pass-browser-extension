// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createRoot } from 'react-dom/client';
import Install from './Install.jsx';
import { preloadAllFontsAsync } from '@/partials/functions/preloadFonts.js';
import { I18nProvider } from '@/partials/context/I18nContext.jsx';

// Preload both Inter and Montserrat fonts for install page
preloadAllFontsAsync();

// Initialize i18n before rendering
const init = async () => {
  await initI18n();

  createRoot(document.getElementById('root')).render(
    <I18nProvider>
      <Install />
    </I18nProvider>
  );
};

init();
