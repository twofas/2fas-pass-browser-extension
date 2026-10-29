// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * License list groups, keyed by the entry's dependencyType.
 */
export const LICENSE_GROUPS = /* @__PURE__ */ Object.freeze({
  dependencies: 'extension',
  devDependencies: 'development',
  font: 'fonts'
});

/**
 * Returns the group of a license entry.
 * @param {Object} entry - License entry.
 * @return {string} 'extension', 'development', 'fonts' or 'other'.
 */
export const getLicenseGroup = entry => {
  return LICENSE_GROUPS[entry?.dependencyType] || 'other';
};

/**
 * Counts the entries per group.
 * @param {Object[]} entries - License entries.
 * @return {{ total: number, groups: Object<string, number> }} Summary.
 */
export const summarizeLicenses = entries => {
  const groups = { extension: 0, development: 0, fonts: 0, other: 0 };

  for (const entry of entries) {
    groups[getLicenseGroup(entry)] += 1;
  }

  return { total: entries.length, groups };
};

/**
 * Filters the entries by group and a search phrase (name, version, description, author, license, keywords).
 * @param {Object[]} entries - License entries.
 * @param {Object} filters - Filters.
 * @param {string|null} filters.group - Group to show, or null for all.
 * @param {string} filters.query - Search phrase.
 * @return {Object[]} Matching entries.
 */
export const filterLicenses = (entries, { group, query }) => {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);

  return entries.filter(entry => {
    if (group && getLicenseGroup(entry) !== group) {
      return false;
    }

    if (words.length === 0) {
      return true;
    }

    const haystack = [entry.name, entry.installedVersion, entry.description, entry.author, entry.licenseType, entry.keywords]
      .filter(value => typeof value === 'string')
      .join(' ')
      .toLowerCase();

    return words.every(word => haystack.includes(word));
  });
};
