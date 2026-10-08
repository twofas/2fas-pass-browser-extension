// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '../..');

const AUTO_IMPORTS_FILE = path.join(ROOT, '.wxt/types/imports-module.d.ts');
const RESOLVE_SUFFIXES = ['', '.js', '.jsx', '.mjs', '.json', '/index.js', '/index.jsx'];
const SOURCE_FILE_REGEX = /\.(m?js|jsx)$/;
const POPUP_DIR = `${path.sep}entrypoints${path.sep}popup${path.sep}`;
const FORBIDDEN_PACKAGES = new Set([
  'react',
  'react-dom',
  'scheduler',
  'motion',
  'framer-motion',
  'react-select',
  'react-router',
  'react-final-form',
  'final-form',
  'react-lottie-player',
  'lottie-web',
  'zustand',
  'qrcode',
  'primereact',
  'react-toastify',
  'react-error-boundary',
  'lottie-react',
  '@splidejs/react-splide',
  '@tanstack/react-virtual',
  'xss'
]);

/**
* Reads the WXT auto-imports (the generated `#imports` declarations).
* @return {Array<{name: string, from: string}>} Auto-imported names with their absolute (or package) source.
*/
export const getAutoImports = () => {
  const declarations = fs.readFileSync(AUTO_IMPORTS_FILE, 'utf8');
  const autoImports = [];

  for (const match of declarations.matchAll(/export \{ ([^}]+) \} from '([^']+)'/g)) {
    const from = match[2].startsWith('.') ? path.resolve(ROOT, '.wxt', match[2]) : match[2];

    for (const part of match[1].split(',')) {
      const [name, alias] = part.trim().split(/\s+as\s+/);
      autoImports.push({ name: alias || name, from });
    }
  }

  return autoImports;
};

const stripComments = code => code
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .map(line => line.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'))
  .join('\n');

const getSpecifiers = code => {
  const specifiers = [];
  const patterns = [
    /\bimport\s+(?:[\w$*{}\s,]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+(?:\*|\{[^}]*\})(?:\s+as\s+[\w$]+)?\s+from\s+['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g
  ];

  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      specifiers.push(match[1]);
    }
  }

  return specifiers;
};

const getPackageName = specifier => {
  const parts = specifier.split('/');

  return specifier.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
};

const resolveFile = (specifier, importer) => {
  const [request] = specifier.split('?');
  let base;

  if (request.startsWith('@/')) {
    base = path.join(ROOT, request.slice(2));
  } else if (request.startsWith('.')) {
    base = path.resolve(path.dirname(importer), request);
  } else if (path.isAbsolute(request)) {
    base = request;
  } else {
    return null;
  }

  for (const suffix of RESOLVE_SUFFIXES) {
    const candidate = `${base}${suffix}`;

    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
};

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
* Walks every static, re-exported, dynamic and WXT auto-import reachable from an entry and lists the ones that would put
* React (or another popup-only library) into its bundle. The walk ignores tree-shaking on purpose: barrels whose
* re-exports have side effects (React views, CSS modules) end up in the bundle even when the imported name is unused.
* @param {string} entry - Absolute path of the entry.
* @param {Array<{name: string, from: string}>} autoImports - WXT auto-imports from getAutoImports().
* @param {Object} [options] - Walk options.
* @param {boolean} [options.allowPopupModules=false] - Allows plain JS modules from entrypoints/popup (constants, store helpers).
* @return {Array<string>} Human-readable import chains of every violation.
*/
export const findImportLeaks = (entry, autoImports, { allowPopupModules = false } = {}) => {
  const parents = new Map([[entry, null]]);
  const queue = [entry];
  const violations = [];
  const chainOf = file => {
    const chain = [];

    for (let current = file; current; current = parents.get(current)) {
      chain.unshift(path.relative(ROOT, current));
    }

    return chain.join(' -> ');
  };

  while (queue.length > 0) {
    const file = queue.shift();

    if (!SOURCE_FILE_REGEX.test(file)) {
      continue;
    }

    if (file.endsWith('.jsx') || (!allowPopupModules && file.includes(POPUP_DIR))) {
      violations.push(chainOf(file));
      continue;
    }

    const code = stripComments(fs.readFileSync(file, 'utf8'));
    const ownPath = file.replace(SOURCE_FILE_REGEX, '');
    const specifiers = getSpecifiers(code);

    for (const { name, from } of autoImports) {
      if (from === ownPath || from.startsWith('wxt')) {
        continue;
      }

      if (new RegExp(`(?<![\\w$.])${escapeRegExp(name)}(?![\\w$])`).test(code)) {
        specifiers.push(from);
      }
    }

    for (const specifier of specifiers) {
      if (specifier.includes('?react') || specifier.includes('.module.scss')) {
        violations.push(`${chainOf(file)} -> ${specifier}`);
        continue;
      }

      const resolved = resolveFile(specifier, file);

      if (resolved) {
        if (!parents.has(resolved)) {
          parents.set(resolved, file);
          queue.push(resolved);
        }

        continue;
      }

      if (!specifier.startsWith('.') && !specifier.startsWith('@/') && FORBIDDEN_PACKAGES.has(getPackageName(specifier))) {
        violations.push(`${chainOf(file)} -> ${specifier}`);
      }
    }
  }

  return violations;
};
