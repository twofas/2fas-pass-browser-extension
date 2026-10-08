// @vitest-environment node
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Motion is loaded through LazyMotion with the synchronous domAnimation feature bundle: the slim `m`
// components animate without any deferred loading. A single full `motion` component would pull the whole
// feature set back into the bundle, so the source must only use `m` from 'motion/react-m'.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '@/tests/importGraph/findImportLeaks';

const SOURCE_DIRS = ['entrypoints', 'models', 'partials', 'hooks'];
const SOURCE_FILE_REGEX = /\.(m?js|jsx)$/;
const TEST_FILE_REGEX = /\.test\.(m?js|jsx)$/;

const listSourceFiles = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => {
  const fullPath = path.join(dir, dirent.name);

  if (dirent.isDirectory()) {
    return listSourceFiles(fullPath);
  }

  return SOURCE_FILE_REGEX.test(dirent.name) && !TEST_FILE_REGEX.test(dirent.name) ? [fullPath] : [];
});

const sourceFiles = SOURCE_DIRS.flatMap(dir => listSourceFiles(path.join(ROOT, dir)));

const FULL_MOTION_PATTERNS = [
  /import\s*\{[^}]*\bmotion\b[^}]*\}\s*from\s*['"]motion\/react['"]/,
  /import\s*\*\s*as\s*[\w$]+\s*from\s*['"]motion\/react['"]/,
  /from\s*['"](framer-motion|motion\/react-client)['"]/,
  /<\/?motion\./
];

// domAnimation has no layout animations and no drag gesture; these props need the larger domMax bundle.
const DOM_MAX_PROPS_PATTERN = /<m\.[\w]+[^>]*\s(layout|layoutId|layoutScroll|drag|dragConstraints)\b/;

describe('LazyMotion', () => {
  it('no source file uses the full motion component', () => {
    const offenders = sourceFiles.filter(file => {
      const code = fs.readFileSync(file, 'utf8');

      return FULL_MOTION_PATTERNS.some(pattern => pattern.test(code));
    });

    expect(offenders.map(file => path.relative(ROOT, file))).toEqual([]);
  });

  it('no m component uses a feature outside domAnimation (layout animations, drag)', () => {
    const offenders = sourceFiles.filter(file => DOM_MAX_PROPS_PATTERN.test(fs.readFileSync(file, 'utf8')));

    expect(offenders.map(file => path.relative(ROOT, file))).toEqual([]);
  });

  it.each(['entrypoints/popup/Popup.jsx', 'entrypoints/install/main.jsx'])('%s provides the synchronous domAnimation features', file => {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');

    expect(code).toMatch(/<LazyMotion features=\{domAnimation\}/);
  });
});
