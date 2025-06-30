// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/* global FontFace */

/** 
* Function to load custom fonts.
* @return {boolean} True if fonts are already loaded, false otherwise.
*/
const loadFonts = () => {
  if (document.fonts.check('600 16px Twofas-Pass-Inter') && document.fonts.check('500 16px Twofas-Pass-Inter') &&  document.fonts.check('normal 16px Twofas-Pass-Inter')) {
    return false;
  }

  let fonts = [
    new FontFace(
      'Twofas-Pass-Inter',
      `url(${browser.runtime.getURL('fonts/inter.woff2')})`
    )
  ];

  fonts.forEach(font => document.fonts.add(font));

  window.addEventListener('beforeunload', () => {
    fonts.forEach(font => document.fonts.delete(font));
    fonts = null;
  }, { once: true });
};

export default loadFonts;
