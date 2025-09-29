// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Preload Inter font only.
* @return {Promise} Promise that resolves when font is loaded.
*/
export const preloadInterFont = async () => {
  if (!document.fonts) {
    return Promise.resolve();
  }

  const interFont = new FontFace(
    'Twofas-Pass-Inter',
    'url("/fonts/inter.woff2") format("woff2")',
    {
      weight: '100 900',
      style: 'normal',
      display: 'swap'
    }
  );

  document.fonts.add(interFont);

  try {
    await interFont.load();
  } catch {}

  return true;
};

/**
* Preload both Inter and Montserrat fonts.
* @return {Promise} Promise that resolves when fonts are loaded.
*/
export const preloadAllFonts = async () => {
  if (!document.fonts) {
    return Promise.resolve();
  }

  const fontPromises = [];

  const interFont = new FontFace(
    'Twofas-Pass-Inter',
    'url("/fonts/inter.woff2") format("woff2")',
    {
      weight: '100 900',
      style: 'normal',
      display: 'swap'
    }
  );

  const montserratFont = new FontFace(
    'Montserrat',
    'url("/fonts/montserrat.woff2") format("woff2")',
    {
      weight: '100 900',
      style: 'normal',
      display: 'swap'
    }
  );

  document.fonts.add(interFont);
  document.fonts.add(montserratFont);

  fontPromises.push(interFont.load());
  fontPromises.push(montserratFont.load());

  try {
    await Promise.all(fontPromises);
  } catch {}

  return true;
};

/**
* Preload Inter font without blocking the main thread.
*/
export const preloadInterFontAsync = () => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      preloadInterFont();
    });
  } else {
    setTimeout(() => {
      preloadInterFont();
    }, 0);
  }
};

/**
* Preload all fonts without blocking the main thread.
*/
export const preloadAllFontsAsync = () => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      preloadAllFonts();
    });
  } else {
    setTimeout(() => {
      preloadAllFonts();
    }, 0);
  }
};