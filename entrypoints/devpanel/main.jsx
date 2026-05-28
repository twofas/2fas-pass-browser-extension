// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import '@/partials/global-styles/global.scss';

if (!import.meta.env.DEV) {
  document.title = '2FAS Pass — Not available';
  document.body.innerHTML =
    '<main style="font-family:sans-serif;padding:2rem;max-width:560px;margin:40px auto;color:#333;line-height:1.5">' +
    '<h1 style="margin-bottom:8px">Dev panel disabled</h1>' +
    '<p>This page is only available in development builds of the 2FAS Pass browser extension.</p>' +
    '</main>';
} else {
  (async () => {
    const [
      { createRoot },
      { default: DevPanel },
      { preloadAllFontsAsync },
      { I18nProvider }
    ] = await Promise.all([
      import('react-dom/client'),
      import('./DevPanel.jsx'),
      import('@/partials/functions/preloadFonts.js'),
      import('@/partials/context/I18nContext.jsx')
    ]);

    preloadAllFontsAsync();
    await initI18n();

    createRoot(document.getElementById('root')).render(
      <I18nProvider>
        <DevPanel />
      </I18nProvider>
    );
  })();
}
