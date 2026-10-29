// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import '@/partials/global-styles/global.scss';
import { createRoot } from 'react-dom/client';
import Licenses from './Licenses.jsx';
import licenses from '@/open-source-licenses.json';
import { preloadInterFont } from '@/partials/functions/preloadFonts.js';
import { I18nProvider } from '@/partials/context/I18nContext.jsx';
import safariBlankLinks from '@/partials/functions/safariBlankLinks';
import detectDefaultTheme from '@/entrypoints/install/functions/detectDefaultTheme';

preloadInterFont();

/**
* Switches the page theme when the user changes it in the popup.
* @param {string} newValue - New theme.
* @param {string} oldValue - Previous theme.
* @return {void}
*/
const handleThemeChange = (newValue, oldValue) => {
  if (oldValue) {
    document.documentElement.classList.remove(`theme-${oldValue}`);
    document.body.classList.remove(`theme-${oldValue}`);
  }

  const theme = newValue === 'light' || newValue === 'dark' ? newValue : 'unset';

  document.documentElement.classList.add(`theme-${theme}`);
  document.body.classList.add(`theme-${theme}`);
};

/**
* Initializes i18n and the theme, then renders the licenses page.
* @return {Promise<void>}
*/
const init = async () => {
  await initI18n();

  document.documentElement.lang = getI18nState().lang || 'en';
  document.documentElement.classList.add(import.meta.env.BROWSER);

  if (import.meta.env.BROWSER === 'safari') {
    document.addEventListener('click', safariBlankLinks);
  }

  await detectDefaultTheme();
  storage.watch('local:theme', handleThemeChange);

  createRoot(document.getElementById('root')).render(
    <I18nProvider>
      <Licenses entries={licenses} />
    </I18nProvider>
  );
};

init();
