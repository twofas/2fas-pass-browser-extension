// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/* global process */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import buildFontEntries from './licenseInfo/buildFontEntries.js';
import collectPackages from './licenseInfo/collectPackages.js';
import fetchRemoteVersions from './licenseInfo/fetchRemoteVersions.js';
import fetchRepositoryLicenseFiles from './licenseInfo/fetchRepositoryLicenseFiles.js';
import { getPreviousRemoteVersions, readPreviousEntries, reusePreviousLicenseFiles } from './licenseInfo/previousLicenseInfo.js';
import { buildEntries, renderLicenseHtml, serializeLicenseJson } from './licenseInfo/formatLicenseInfo.js';
import { parseYarnLock } from './licenseInfo/readPackageDetails.js';

const OUTPUT_FILES = Object.freeze({
  json: 'open-source-licenses.json',
  html: 'open-source-licenses.html'
});

/**
 * Reads "key=value" command line arguments.
 * @param {string[]} args - Arguments after the script path.
 * @return {Object<string, string>} Parsed arguments.
 */
const parseArgs = args => {
  return Object.fromEntries(args.map(arg => {
    const [key, ...value] = arg.replace(/^--/, '').split('=');

    return [key, value.join('=') || 'true'];
  }));
};

/**
 * Generates the open source license files (JSON and/or HTML) of the project, overwriting the previous ones.
 * Packages whose installed version is the same as in the previous JSON reuse its network data (remote version,
 * license files from GitHub); everything read from node_modules and yarn.lock is always read again.
 * The fonts from licenseInfo/fonts.js follow the npm packages.
 * @param {Object} options - Options.
 * @param {string} options.rootDir - Project root.
 * @param {string} [options.format='all'] - 'json', 'html' or 'all'.
 * @param {string} [options.outDir] - Output folder (defaults to the project root).
 * @param {boolean} [options.offline=false] - Skips the network: the npm registry (remoteVersion becomes 'n/a') and license files from GitHub.
 * @param {boolean} [options.refresh=false] - Ignores the previous JSON and fetches the network data of every package again.
 * @param {Function} [options.fetchFn] - fetch implementation for the npm registry and GitHub.
 * @param {Object[]} [options.fonts] - Font list (defaults to licenseInfo/fonts.js).
 * @return {Promise<{ entries: Object[], files: string[], missing: string[], reused: { remoteVersions: number, licenseFiles: number } }>} Generated entries, written files and reuse counts.
 */
export const generateLicenseInfo = async ({ rootDir, format = 'all', outDir = rootDir, offline = false, refresh = false, fetchFn, fonts }) => {
  if (!['json', 'html', 'all'].includes(format)) {
    throw new Error(`Unknown format "${format}" (expected json, html or all)`);
  }

  const { rootPackage, packages, missing } = collectPackages(rootDir);
  const lockPath = path.join(rootDir, 'yarn.lock');
  const lock = fs.existsSync(lockPath) ? parseYarnLock(fs.readFileSync(lockPath, 'utf8')) : new Map();
  const previous = refresh ? new Map() : readPreviousEntries(path.join(outDir, OUTPUT_FILES.json));
  const remoteVersions = getPreviousRemoteVersions(previous, packages);
  let reusedRemoteVersions = remoteVersions.size;

  if (!offline) {
    const namesToFetch = packages.map(record => record.name).filter(name => !remoteVersions.has(name));

    for (const [name, version] of await fetchRemoteVersions(namesToFetch, fetchFn)) {
      remoteVersions.set(name, version);
    }
  }

  const entries = buildEntries(packages, { rootDir: fs.realpathSync(rootDir), remoteVersions, lock });
  const reusedLicenseFiles = reusePreviousLicenseFiles(entries, previous);
  const files = [];

  if (!offline) {
    await fetchRepositoryLicenseFiles(entries.filter(entry => !reusedLicenseFiles.has(entry)), fetchFn);
  }

  const fontEntries = await buildFontEntries({ rootDir, rootPackage, previous, offline, fetchFn, fonts });

  entries.push(...fontEntries.entries);
  missing.push(...fontEntries.missing);
  reusedRemoteVersions += fontEntries.reused;

  fs.mkdirSync(outDir, { recursive: true });

  if (format === 'json' || format === 'all') {
    const filePath = path.join(outDir, OUTPUT_FILES.json);
    fs.writeFileSync(filePath, serializeLicenseJson(entries));
    files.push(filePath);
  }

  if (format === 'html' || format === 'all') {
    const filePath = path.join(outDir, OUTPUT_FILES.html);
    fs.writeFileSync(filePath, renderLicenseHtml(entries, { title: `${rootPackage.name} ${rootPackage.version} - open source licenses` }));
    files.push(filePath);
  }

  return { entries, files, missing, reused: { remoteVersions: reusedRemoteVersions, licenseFiles: reusedLicenseFiles.size } };
};

/**
 * CLI entry: `node build_scripts/generateLicenseInfo.js [format=json|html|all] [out=<dir>] [offline] [refresh]`.
 * @return {Promise<void>}
 */
const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = process.cwd();
  const { entries, files, missing, reused } = await generateLicenseInfo({
    rootDir,
    format: args.format || 'all',
    outDir: args.out ? path.resolve(rootDir, args.out) : rootDir,
    offline: args.offline === 'true',
    refresh: args.refresh === 'true'
  });

  const withoutRemote = entries.filter(entry => entry.remoteVersion === 'n/a').length;
  const withoutFiles = entries.filter(entry => Object.keys(entry.licenseFiles).length === 0).length;

  console.log(`License info: ${entries.length} packages (${entries.filter(entry => entry.direct).length} direct).`);
  console.log(`Without a license file: ${withoutFiles}. Without a remote version: ${withoutRemote}.`);
  console.log(`Reused from the previous JSON: ${reused.remoteVersions} remote versions, ${reused.licenseFiles} repository license lookups.`);

  for (const missingDependency of missing) {
    console.warn(`Not installed: ${missingDependency}`);
  }

  for (const file of files) {
    console.log(`Written ${path.relative(rootDir, file)}`);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(err => {
    console.error('Error generating license info:', err);
    process.exitCode = 1;
  });
}
