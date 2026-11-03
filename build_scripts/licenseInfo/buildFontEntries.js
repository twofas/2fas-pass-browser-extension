// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import FONTS from './fonts.js';
import readFontInfo from './readFontInfo.js';
import { parseGitHubRepository } from './fetchRepositoryLicenseFiles.js';

const TIMEOUT_MS = 15000;

/**
 * Fetches the latest release tag of a GitHub repository.
 * @param {string} repository - Repository URL.
 * @param {Function} fetchFn - fetch implementation.
 * @return {Promise<string|null>} Release version without a leading "v", or null.
 */
const fetchLatestRelease = async (repository, fetchFn) => {
  const location = parseGitHubRepository(repository);

  if (!location) {
    return null;
  }

  try {
    const response = await fetchFn(`https://api.github.com/repos/${location.owner}/${location.repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (!response.ok) {
      return null;
    }

    const release = await response.json();

    return typeof release?.tag_name === 'string' ? release.tag_name.replace(/^v/, '') : null;
  } catch {
    return null;
  }
};

/**
 * Builds the license entries of the fonts, in the same format as the npm package entries.
 * @param {Object} options - Options.
 * @param {string} options.rootDir - Project root.
 * @param {Object} options.rootPackage - Project package.json.
 * @param {Map<string, Object>} options.previous - Entries of the previous run (their remote versions are reused).
 * @param {boolean} options.offline - Skips the network.
 * @param {Function} [options.fetchFn] - fetch implementation.
 * @param {Object[]} [options.fonts] - Font list (defaults to fonts.js).
 * @return {Promise<{ entries: Object[], missing: string[], reused: number }>} Font entries, missing font files and reused remote versions.
 */
const buildFontEntries = async ({ rootDir, rootPackage, previous, offline, fetchFn = globalThis.fetch, fonts = FONTS }) => {
  const entries = [];
  const missing = [];
  let reused = 0;

  for (const font of fonts) {
    const files = font.files.filter(file => {
      const exists = fs.existsSync(path.join(rootDir, file));

      if (!exists) {
        missing.push(`${file} (font ${font.name})`);
      }

      return exists;
    });

    if (files.length === 0) {
      continue;
    }

    const infos = files.map(file => readFontInfo(fs.readFileSync(path.join(rootDir, file))));
    const [info] = infos;
    const name = `${font.name} (font)`;
    const version = info.versionNumber || 'n/a';
    const previousEntry = previous.get(`${name}@${version}`);
    let remoteVersion = previousEntry && previousEntry.remoteVersion !== 'n/a' ? previousEntry.remoteVersion : null;

    if (remoteVersion) {
      reused += 1;
    } else if (!offline) {
      remoteVersion = await fetchLatestRelease(font.repository, fetchFn);
    }

    const licensePath = path.join(rootDir, font.licenseFile);
    const licenseFiles = fs.existsSync(licensePath)
      ? { [path.basename(font.licenseFile)]: fs.readFileSync(licensePath, 'utf8').replace(/\r\n?/g, '\n') }
      : {};

    if (Object.keys(licenseFiles).length === 0) {
      missing.push(`${font.licenseFile} (license of font ${font.name})`);
    }

    entries.push({
      department: 'kessler',
      relatedTo: 'stuff',
      name,
      licensePeriod: 'perpetual',
      material: 'material',
      licenseType: /open font license/i.test(info.licenseDescription) || /\bOFL\b/i.test(info.licenseUrl) ? 'OFL-1.1' : 'n/a',
      link: font.repository,
      remoteVersion: remoteVersion || 'n/a',
      installedVersion: version,
      definedVersion: font.release || version,
      author: info.designer || info.manufacturer || info.copyright,
      dependencyType: 'font',
      direct: true,
      depth: 1,
      requiredBy: { [`${rootPackage.name}@${rootPackage.version}`]: font.usedBy },
      description: info.description,
      homepage: info.vendorUrl || info.designerUrl,
      repository: font.repository,
      copyright: [...new Set(infos.map(item => item.copyright).filter(Boolean))].join('; '),
      designer: info.designer,
      designerUrl: info.designerUrl,
      manufacturer: info.manufacturer,
      licenseDescription: info.licenseDescription,
      licenseUrl: info.licenseUrl,
      styles: [...new Set(infos.map(item => item.subfamily).filter(Boolean))].join(', '),
      axes: info.axes,
      glyphs: info.glyphs,
      source: font.source,
      modifications: font.modifications,
      paths: files.join(', '),
      sha256: Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(rootDir, file))).digest('hex')])),
      licenseFilesSource: Object.keys(licenseFiles).length > 0 ? font.licenseFile : 'none',
      licenseFiles
    });
  }

  return { entries, missing, reused };
};

export default buildFontEntries;
