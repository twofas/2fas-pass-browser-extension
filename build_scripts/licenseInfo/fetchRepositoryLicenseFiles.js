// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const RAW_GITHUB_URL = 'https://raw.githubusercontent.com';
const LICENSE_FILE_NAMES = Object.freeze(['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md', 'LICENCE', 'COPYING']);
const CONCURRENCY = 4;
const TIMEOUT_MS = 15000;

/**
 * Reads the GitHub owner, repository and package folder from an entry's repository field.
 * @param {string} repository - Repository as written by buildEntry ("<url>" or "<url> (directory: <dir>)").
 * @return {{ owner: string, repo: string, directory: string }|null} GitHub location or null for other hosts.
 */
export const parseGitHubRepository = repository => {
  if (!repository) {
    return null;
  }

  const [, url, directory = ''] = /^(.*?)(?: \(directory: (.+)\))?$/.exec(repository.trim());
  const match = /^(?:github:)?([\w.-]+)\/([\w.-]+?)(?:\.git)?$/.exec(url)
    || /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/#?].*)?$/.exec(url);

  if (!match) {
    return null;
  }

  return { owner: match[1], repo: match[2], directory: directory.replace(/^\/+|\/+$/g, '') };
};

/**
 * Downloads the first license file found in the package repository: the package folder, then the repository root,
 * first at the release tag, then on the default branch.
 * @param {Object} entry - License entry without license files.
 * @param {Function} fetchFn - fetch implementation.
 * @return {Promise<{ name: string, text: string, url: string }|null>} Found file or null.
 */
const fetchLicenseFile = async (entry, fetchFn) => {
  const location = parseGitHubRepository(entry.repository);

  if (!location) {
    return null;
  }

  const refs = [`v${entry.installedVersion}`, 'HEAD'];
  const folders = [...new Set([location.directory, ''])];

  for (const ref of refs) {
    for (const folder of folders) {
      for (const name of LICENSE_FILE_NAMES) {
        const filePath = folder ? `${folder}/${name}` : name;

        try {
          const response = await fetchFn(`${RAW_GITHUB_URL}/${location.owner}/${location.repo}/${ref}/${filePath}`, {
            signal: AbortSignal.timeout(TIMEOUT_MS)
          });

          if (response.ok) {
            const text = (await response.text()).replace(/\r\n?/g, '\n');

            if (text.trim() !== '') {
              return { name, text, url: `https://github.com/${location.owner}/${location.repo}/blob/${ref}/${filePath}` };
            }
          }
        } catch {}
      }
    }
  }

  return null;
};

/**
 * Adds a license file from the package's GitHub repository to entries whose package ships no license file
 * (a README license section, if any, is kept next to it). licenseFilesSource becomes the file URL.
 * @param {Object[]} entries - License entries (modified in place).
 * @param {Function} [fetchFn] - fetch implementation (defaults to the global fetch).
 * @return {Promise<void>}
 */
const fetchRepositoryLicenseFiles = async (entries, fetchFn = globalThis.fetch) => {
  const pending = entries.filter(entry => entry.licenseFilesSource !== 'package');
  let index = 0;

  /**
   * Takes the next entry from the shared list until the list is empty.
   * @return {Promise<void>}
   */
  const worker = async () => {
    while (index < pending.length) {
      const entry = pending[index];
      index += 1;

      const file = await fetchLicenseFile(entry, fetchFn);

      if (file) {
        entry.licenseFiles = { [file.name]: file.text, ...entry.licenseFiles };
        entry.licenseFilesSource = file.url;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
};

export default fetchRepositoryLicenseFiles;
