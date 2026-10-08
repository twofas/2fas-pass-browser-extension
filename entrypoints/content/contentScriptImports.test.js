// @vitest-environment node
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, getAutoImports, findImportLeaks } from '@/tests/importGraph/findImportLeaks';

const ENTRYPOINTS_DIR = path.join(ROOT, 'entrypoints');

const getContentScriptEntries = () => {
  const entries = [];

  for (const dirent of fs.readdirSync(ENTRYPOINTS_DIR, { withFileTypes: true })) {
    if (dirent.isFile() && /\.content\.(m?js|jsx)$/.test(dirent.name)) {
      entries.push(path.join(ENTRYPOINTS_DIR, dirent.name));
    } else if (dirent.isDirectory() && (dirent.name === 'content' || dirent.name.endsWith('.content'))) {
      entries.push(path.join(ENTRYPOINTS_DIR, dirent.name, 'index.js'));
    }
  }

  return entries;
};

describe('content scripts stay free of React and popup code', () => {
  const autoImports = getAutoImports();
  const entries = getContentScriptEntries();

  it('finds every content script entry', () => {
    expect(entries.map(entry => path.relative(ROOT, entry)).sort()).toEqual(expect.arrayContaining([
      'entrypoints/content/index.js',
      'entrypoints/focus.content.js',
      'entrypoints/prompt.content.js',
      'entrypoints/share.content.js'
    ]));
  });

  it.each(entries.map(entry => [path.relative(ROOT, entry), entry]))('%s does not reach React, .jsx or popup modules', (_, entry) => {
    expect(findImportLeaks(entry, autoImports)).toEqual([]);
  });
});
