// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const REGISTRY_URL = 'https://registry.npmjs.org';
const CONCURRENCY = 6;
const TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 8;
const RETRY_BASE_DELAY_MS = 1000;
const MAX_RETRY_AFTER_MS = 30000;

/**
 * Waits for the given time.
 * @param {number} ms - Delay in milliseconds.
 * @return {Promise<void>}
 */
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches the "latest" dist-tag of one package from the npm registry, retrying on rate limits and server errors.
 * @param {string} name - Package name.
 * @param {Function} fetchFn - fetch implementation.
 * @param {number} retryDelayMs - Base delay between attempts (doubled on each retry).
 * @return {Promise<string|null>} Latest version or null when it cannot be fetched.
 */
const fetchLatestVersion = async (name, fetchFn, retryDelayMs) => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchFn(`${REGISTRY_URL}/-/package/${name.replace('/', '%2f')}/dist-tags`, {
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });

      if (response.ok) {
        const tags = await response.json();

        return typeof tags?.latest === 'string' ? tags.latest : null;
      }

      if (response.status !== 429 && response.status < 500) {
        return null;
      }

      const retryAfter = Number(response.headers?.get?.('retry-after'));

      if (attempt < MAX_ATTEMPTS) {
        await wait(retryAfter > 0 ? Math.min(retryAfter * 1000, MAX_RETRY_AFTER_MS) : Math.min(retryDelayMs * 2 ** (attempt - 1), MAX_RETRY_AFTER_MS));
      }
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        await wait(retryDelayMs * 2 ** (attempt - 1));
      }
    }
  }

  return null;
};

/**
 * Fetches the latest published version of every package from the npm registry.
 * @param {string[]} names - Package names.
 * @param {Function} [fetchFn] - fetch implementation (defaults to the global fetch).
 * @param {number} [retryDelayMs] - Base delay between attempts.
 * @return {Promise<Map<string, string>>} Package name to latest version (packages that failed are absent).
 */
const fetchRemoteVersions = async (names, fetchFn = globalThis.fetch, retryDelayMs = RETRY_BASE_DELAY_MS) => {
  const unique = [...new Set(names)];
  const versions = new Map();
  let index = 0;

  /**
   * Takes the next package from the shared list until the list is empty.
   * @return {Promise<void>}
   */
  const worker = async () => {
    while (index < unique.length) {
      const name = unique[index];
      index += 1;

      const version = await fetchLatestVersion(name, fetchFn, retryDelayMs);

      if (version) {
        versions.set(name, version);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, unique.length) }, worker));

  return versions;
};

export default fetchRemoteVersions;
