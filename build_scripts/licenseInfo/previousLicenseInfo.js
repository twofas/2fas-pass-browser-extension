// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import fs from 'node:fs';

/**
 * Reads the entries of a previously generated license JSON, keyed by name@installedVersion.
 * A missing or unreadable file (e.g. the old appended license-report output) gives an empty map.
 * @param {string} filePath - Path of the previous open-source-licenses.json.
 * @return {Map<string, Object>} Previous entries.
 */
export const readPreviousEntries = filePath => {
  const previous = new Map();
  let entries;

  try {
    entries = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return previous;
  }

  if (!Array.isArray(entries)) {
    return previous;
  }

  for (const entry of entries) {
    if (entry && typeof entry.name === 'string' && typeof entry.installedVersion === 'string') {
      previous.set(`${entry.name}@${entry.installedVersion}`, entry);
    }
  }

  return previous;
};

/**
 * Returns the previous entry of a package if it was generated online (it has a remote version),
 * i.e. its network data can be reused.
 * @param {Map<string, Object>} previous - Previous entries.
 * @param {string} key - name@version of the package.
 * @return {Object|null} Reusable previous entry.
 */
const getReusableEntry = (previous, key) => {
  const entry = previous.get(key);

  return entry && typeof entry.remoteVersion === 'string' && entry.remoteVersion !== 'n/a' ? entry : null;
};

/**
 * Takes the remote versions of the packages whose installed version has not changed since the previous run.
 * @param {Map<string, Object>} previous - Previous entries.
 * @param {Object[]} packages - Package records from collectPackages.
 * @return {Map<string, string>} Package name to the previously fetched latest version.
 */
export const getPreviousRemoteVersions = (previous, packages) => {
  const versions = new Map();

  for (const record of packages) {
    const entry = getReusableEntry(previous, record.key);

    if (entry) {
      versions.set(record.name, entry.remoteVersion);
    }
  }

  return versions;
};

/**
 * Copies the repository license files (and the result of a failed lookup) from the previous run to entries
 * whose package ships no license file and whose installed version has not changed.
 * @param {Object[]} entries - License entries (modified in place).
 * @param {Map<string, Object>} previous - Previous entries.
 * @return {Set<Object>} Entries that reused the previous data.
 */
export const reusePreviousLicenseFiles = (entries, previous) => {
  const reused = new Set();

  for (const entry of entries) {
    if (entry.licenseFilesSource === 'package') {
      continue;
    }

    const previousEntry = getReusableEntry(previous, `${entry.name}@${entry.installedVersion}`);

    if (!previousEntry || typeof previousEntry.licenseFilesSource !== 'string' || !previousEntry.licenseFiles || typeof previousEntry.licenseFiles !== 'object') {
      continue;
    }

    entry.licenseFiles = { ...previousEntry.licenseFiles, ...entry.licenseFiles };
    entry.licenseFilesSource = previousEntry.licenseFilesSource;
    reused.add(entry);
  }

  return reused;
};
