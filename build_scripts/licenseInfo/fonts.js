// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Fonts shipped with the extension and the Safari container app. Everything else in their license entries
 * (version, copyright, designer, license, axes) is read from the font files.
 */
const FONTS = Object.freeze([
  Object.freeze({
    name: 'Inter',
    release: '4.1',
    repository: 'https://github.com/rsms/inter',
    usedBy: 'Browser extension (popup, install page)',
    source: 'web/InterVariable.woff2 from https://github.com/rsms/inter/releases/tag/v4.1',
    modifications: 'Vertical metrics set to the values of Inter 3.19, so the layout does not change: hhea ascender 2234, descender -655, line gap 0; OS/2 usWinAscent 2234, usWinDescent 655, sTypoAscender 1536, sTypoDescender -512, sTypoLineGap 0, USE_TYPO_METRICS off; OS/2 xAvgCharWidth 1337. Glyphs, names and every other table are unchanged.',
    files: Object.freeze(['public/fonts/inter.woff2']),
    licenseFile: 'public/fonts/OFL-Inter.txt'
  }),
  Object.freeze({
    name: 'Montserrat',
    release: '',
    repository: 'https://github.com/JulietaUla/Montserrat',
    usedBy: 'Safari container app (macOS)',
    source: '',
    modifications: '',
    files: Object.freeze([
      '2FAS Pass Browser Extension/2FAS Pass Browser Extension/Fonts/Montserrat-Regular.ttf',
      '2FAS Pass Browser Extension/2FAS Pass Browser Extension/Fonts/Montserrat-Bold.ttf',
      '2FAS Pass BE - Dev/Shared (App)/Fonts/Montserrat-Regular.ttf',
      '2FAS Pass BE - Dev/Shared (App)/Fonts/Montserrat-Bold.ttf'
    ]),
    licenseFile: 'public/fonts/OFL-Montserrat.txt'
  })
]);

export default FONTS;
