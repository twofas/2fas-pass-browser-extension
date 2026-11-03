// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Fields shown in the details of a license entry, in display order, with their i18n label keys.
 * The license-report placeholders (department, relatedTo, licensePeriod, material) carry no information and are not shown;
 * licenseFiles are shown separately.
 */
const DETAIL_FIELDS = /* @__PURE__ */ Object.freeze([
  ['installedVersion', 'licenses_field_installed_version'],
  ['definedVersion', 'licenses_field_defined_version'],
  ['remoteVersion', 'licenses_field_remote_version'],
  ['licenseType', 'licenses_field_license_type'],
  ['author', 'licenses_field_author'],
  ['description', 'licenses_field_description'],
  ['homepage', 'licenses_field_homepage'],
  ['repository', 'licenses_field_repository'],
  ['link', 'licenses_field_link'],
  ['bugs', 'licenses_field_bugs'],
  ['funding', 'licenses_field_funding'],
  ['contributors', 'licenses_field_contributors'],
  ['maintainers', 'licenses_field_maintainers'],
  ['keywords', 'licenses_field_keywords'],
  ['dependencyType', 'licenses_field_dependency_type'],
  ['direct', 'licenses_field_direct'],
  ['depth', 'licenses_field_depth'],
  ['requiredBy', 'licenses_field_required_by'],
  ['dependencies', 'licenses_field_dependencies'],
  ['optionalDependencies', 'licenses_field_optional_dependencies'],
  ['peerDependencies', 'licenses_field_peer_dependencies'],
  ['engines', 'licenses_field_engines'],
  ['deprecated', 'licenses_field_deprecated'],
  ['copyright', 'licenses_field_copyright'],
  ['designer', 'licenses_field_designer'],
  ['designerUrl', 'licenses_field_designer_url'],
  ['manufacturer', 'licenses_field_manufacturer'],
  ['licenseDescription', 'licenses_field_license_description'],
  ['licenseUrl', 'licenses_field_license_url'],
  ['styles', 'licenses_field_styles'],
  ['axes', 'licenses_field_axes'],
  ['glyphs', 'licenses_field_glyphs'],
  ['source', 'licenses_field_source'],
  ['modifications', 'licenses_field_modifications'],
  ['resolved', 'licenses_field_resolved'],
  ['integrity', 'licenses_field_integrity'],
  ['sha256', 'licenses_field_sha256'],
  ['paths', 'licenses_field_paths'],
  ['licenseFilesSource', 'licenses_field_license_files_source']
]);

/**
 * Returns the URL to link a value to: only http(s) URLs, "git+https://…" without the "git+" prefix.
 * @param {string} value - Field value.
 * @return {string|null} URL or null when the value is not a web URL.
 */
export const getSafeUrl = value => {
  const match = /^(?:git\+)?(https?:\/\/[^\s()]+)/i.exec(String(value || '').trim());

  if (!match) {
    return null;
  }

  try {
    const url = new URL(match[1].replace(/\.git$/, ''));

    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
};

/**
 * Lists the non-empty details of a license entry.
 * Every value is either a string ('text') or an object of name/value pairs ('pairs').
 * @param {Object} entry - License entry.
 * @return {Array<{ key: string, label: string, kind: 'text'|'pairs', value: string|Array<[string, string]> }>} Details.
 */
const getEntryDetails = entry => {
  const details = [];

  for (const [key, label] of DETAIL_FIELDS) {
    const value = entry?.[key];

    if (key === 'link' && value === entry?.repository) {
      continue;
    }

    if (value && typeof value === 'object') {
      const pairs = Object.entries(value).map(([name, pairValue]) => [name, String(pairValue)]);

      if (pairs.length > 0) {
        details.push({ key, label, kind: 'pairs', value: pairs });
      }

      continue;
    }

    if (value === undefined || value === null || value === '' || value === 'n/a') {
      continue;
    }

    details.push({ key, label, kind: 'text', value: String(value) });
  }

  return details;
};

export default getEntryDetails;
