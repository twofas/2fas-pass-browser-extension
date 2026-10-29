// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Buffer } from 'node:buffer';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import buildFontEntries from './buildFontEntries.js';
import FONTS from './fonts.js';
import readFontInfo from './readFontInfo.js';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../..');
const INTER = path.join(PROJECT_ROOT, 'public/fonts/inter.woff2');
const INTER_3_ASCENT = 3072 / 2816;
const INTER_3_DESCENT = -900 / 2816;

let root;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'license-fonts-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('readFontInfo', () => {
  it('reads the names, axes and metrics of a WOFF2 font', () => {
    const info = readFontInfo(readFileSync(INTER));

    expect(info).toMatchObject({
      copyright: 'Copyright 2016 The Inter Project Authors',
      family: 'Inter Variable',
      versionNumber: '4.001',
      designer: 'Rasmus Andersson',
      licenseUrl: 'http://scripts.sil.org/OFL',
      axes: 'opsz 14–32 (default 14), wght 100–900 (default 400)',
      unitsPerEm: 2048
    });
    expect(info.licenseDescription).toContain('SIL Open Font License, Version 1.1');
  });

  it('reads a TrueType font', () => {
    const info = readFontInfo(readFileSync(path.join(PROJECT_ROOT, FONTS[1].files[0])));

    expect(info).toMatchObject({ family: 'Montserrat', subfamily: 'Regular', versionNumber: '8.000', axes: '' });
  });

  it('rejects files that are not fonts', () => {
    expect(() => readFontInfo(Buffer.from('not a font'))).toThrow('Unsupported font format');
  });
});

describe('public/fonts/inter.woff2', () => {
  it('keeps the vertical metrics of Inter 3, so the layout of the extension does not move', () => {
    const { unitsPerEm, ascender, descender, lineGap } = readFontInfo(readFileSync(INTER));

    expect(Math.abs(ascender / unitsPerEm - INTER_3_ASCENT)).toBeLessThan(0.001);
    expect(Math.abs(descender / unitsPerEm - INTER_3_DESCENT)).toBeLessThan(0.001);
    expect(lineGap).toBe(0);
  });

  it('ships the license text of every font', () => {
    for (const font of FONTS) {
      expect(readFileSync(path.join(PROJECT_ROOT, font.licenseFile), 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1');
    }
  });
});

describe('buildFontEntries', () => {
  const font = Object.freeze({
    name: 'Inter',
    release: '4.1',
    repository: 'https://github.com/rsms/inter',
    usedBy: 'Popup',
    source: 'release',
    modifications: 'metrics',
    files: ['fonts/inter.woff2', 'fonts/absent.woff2'],
    licenseFile: 'fonts/OFL.txt'
  });
  const rootPackage = { name: 'project', version: '1.0.0' };

  beforeEach(() => {
    mkdirSync(path.join(root, 'fonts'));
    copyFileSync(INTER, path.join(root, 'fonts/inter.woff2'));
    writeFileSync(path.join(root, 'fonts/OFL.txt'), 'OFL text\r\n');
  });

  it('builds an entry with the license-report fields, the font metadata and the license text', async () => {
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ tag_name: 'v4.2' }) }));
    const { entries, missing, reused } = await buildFontEntries({ rootDir: root, rootPackage, previous: new Map(), offline: false, fetchFn, fonts: [font] });

    expect(fetchFn.mock.calls[0][0]).toBe('https://api.github.com/repos/rsms/inter/releases/latest');
    expect(missing).toEqual(['fonts/absent.woff2 (font Inter)']);
    expect(reused).toBe(0);
    expect(entries).toHaveLength(1);
    expect(Object.keys(entries[0]).slice(0, 11)).toEqual(['department', 'relatedTo', 'name', 'licensePeriod', 'material', 'licenseType', 'link', 'remoteVersion', 'installedVersion', 'definedVersion', 'author']);
    expect(entries[0]).toMatchObject({
      name: 'Inter (font)',
      licenseType: 'OFL-1.1',
      link: 'https://github.com/rsms/inter',
      remoteVersion: '4.2',
      installedVersion: '4.001',
      definedVersion: '4.1',
      author: 'Rasmus Andersson',
      dependencyType: 'font',
      requiredBy: { 'project@1.0.0': 'Popup' },
      modifications: 'metrics',
      paths: 'fonts/inter.woff2',
      licenseFilesSource: 'fonts/OFL.txt',
      licenseFiles: { 'OFL.txt': 'OFL text\n' }
    });
    expect(entries[0].sha256['fonts/inter.woff2']).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.values(entries[0]).some(Array.isArray)).toBe(false);
  });

  it('reuses the remote version of an unchanged font and stays offline', async () => {
    const fetchFn = vi.fn();
    const previous = new Map([['Inter (font)@4.001', { remoteVersion: '4.1' }]]);
    const { entries, reused } = await buildFontEntries({ rootDir: root, rootPackage, previous, offline: false, fetchFn, fonts: [font] });
    const offline = await buildFontEntries({ rootDir: root, rootPackage, previous: new Map(), offline: true, fetchFn, fonts: [font] });

    expect(fetchFn).not.toHaveBeenCalled();
    expect(reused).toBe(1);
    expect(entries[0].remoteVersion).toBe('4.1');
    expect(offline.entries[0].remoteVersion).toBe('n/a');
  });
});
