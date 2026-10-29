// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import path from 'node:path';
import { formatPeople, formatPerson, getLicenseType, getUrl, readLicenseFiles, readReadmeLicenseSection } from './readPackageDetails.js';

/**
 * Columns of the license-report format, in its order. Consumers (2fas.com) read these fields, so they stay first and keep their names.
 */
export const LEGACY_COLUMNS = Object.freeze([
  ['department', 'department'],
  ['relatedTo', 'related to'],
  ['name', 'name'],
  ['licensePeriod', 'license period'],
  ['material', 'material / not material'],
  ['licenseType', 'license type'],
  ['link', 'link'],
  ['remoteVersion', 'remote version'],
  ['installedVersion', 'installed version'],
  ['definedVersion', 'defined version'],
  ['author', 'author']
]);

const EXTRA_COLUMNS = Object.freeze([
  ['dependencyType', 'dependency type'],
  ['direct', 'direct'],
  ['depth', 'depth'],
  ['description', 'description'],
  ['homepage', 'homepage']
]);

/**
 * Compares two versions part by part (numeric parts numerically).
 * @param {string} a - First version.
 * @param {string} b - Second version.
 * @return {number} Sort order.
 */
const compareVersions = (a, b) => {
  return a.localeCompare(b, 'en', { numeric: true });
};

/**
 * Builds the license entry of one package. The license-report fields come first, in their original order,
 * everything else follows. Entries contain no arrays (lists are objects or strings), see serializeLicenseJson.
 * @param {Object} record - Package record from collectPackages.
 * @param {Object} context - Shared data.
 * @param {string} context.rootDir - Project root.
 * @param {Map<string, string>} context.remoteVersions - Latest version per package name.
 * @param {Map<string, Object>} context.lock - yarn.lock data keyed by name@version.
 * @return {Object} License entry.
 */
export const buildEntry = (record, { rootDir, remoteVersions, lock }) => {
  const { pkg } = record;
  const licenseType = getLicenseType(pkg);
  const repository = getUrl(pkg.repository);
  const homepage = typeof pkg.homepage === 'string' ? pkg.homepage : '';
  const aliases = record.dirs.map(dir => path.basename(path.dirname(dir)).startsWith('@') ? `${path.basename(path.dirname(dir))}/${path.basename(dir)}` : path.basename(dir));
  const lockData = [record.name, ...aliases].map(name => lock.get(`${name}@${record.version}`)).find(Boolean) || {};
  const packageDir = path.join(rootDir, record.dirs[0]);
  const packageLicenseFiles = readLicenseFiles(packageDir, licenseType);
  const hasPackageLicenseFiles = Object.keys(packageLicenseFiles).length > 0;
  const licenseFiles = hasPackageLicenseFiles ? packageLicenseFiles : readReadmeLicenseSection(packageDir);

  return {
    department: 'kessler',
    relatedTo: 'stuff',
    name: record.name,
    licensePeriod: 'perpetual',
    material: 'material',
    licenseType,
    link: repository || homepage || `https://www.npmjs.com/package/${record.name}`,
    remoteVersion: remoteVersions.get(record.name) || 'n/a',
    installedVersion: record.version,
    definedVersion: record.direct ? record.rootRange : Object.values(record.requiredBy).join(', '),
    author: formatPerson(pkg.author),
    dependencyType: record.dependencyType,
    direct: record.direct,
    depth: record.depth,
    requiredBy: record.requiredBy,
    description: typeof pkg.description === 'string' ? pkg.description : '',
    homepage,
    repository,
    bugs: getUrl(pkg.bugs),
    funding: getUrl(pkg.funding),
    contributors: formatPeople(pkg.contributors),
    maintainers: formatPeople(pkg.maintainers),
    keywords: [].concat(pkg.keywords || []).filter(keyword => typeof keyword === 'string').join(', '),
    engines: pkg.engines && typeof pkg.engines === 'object' && !Array.isArray(pkg.engines) ? pkg.engines : {},
    dependencies: { ...(pkg.dependencies || {}) },
    optionalDependencies: { ...(pkg.optionalDependencies || {}) },
    peerDependencies: { ...(pkg.peerDependencies || {}) },
    deprecated: typeof pkg.deprecated === 'string' ? pkg.deprecated : '',
    resolved: lockData.resolved || '',
    integrity: lockData.integrity || '',
    paths: record.dirs.join(', '),
    licenseFilesSource: hasPackageLicenseFiles ? 'package' : (Object.keys(licenseFiles).length > 0 ? 'package-readme' : 'none'),
    licenseFiles
  };
};

/**
 * Builds every license entry, sorted by name and version.
 * @param {Object[]} packages - Package records from collectPackages.
 * @param {Object} context - Shared data, see buildEntry.
 * @return {Object[]} License entries.
 */
export const buildEntries = (packages, context) => {
  return [...packages]
    .sort((a, b) => a.name.localeCompare(b.name) || compareVersions(a.version, b.version))
    .map(record => buildEntry(record, context));
};

/**
 * Serializes the entries as a JSON array whose only "]" character is the closing bracket of the array.
 * 2fas.com reads the file with `content.split(']')[0] + ']'`, so every "]" inside a string is written as the
 * JSON escape \u005d (JSON.parse restores it), and entries never contain arrays.
 * @param {Object[]} entries - License entries.
 * @return {string} JSON text.
 */
export const serializeLicenseJson = entries => {
  const items = entries.map(entry => JSON.stringify(entry, null, 2).replace(/\]/g, '\\u005d').replace(/^/gm, '  '));

  return `[\n${items.join(',\n')}\n]\n`;
};

/**
 * Escapes text for HTML.
 * @param {*} value - Value to escape.
 * @return {string} Escaped text.
 */
const escapeHtml = value => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Formats an object of name/value pairs as an HTML list.
 * @param {Object} object - Pairs to format.
 * @return {string} HTML.
 */
const renderPairs = object => {
  const pairs = Object.entries(object || {});

  if (pairs.length === 0) {
    return '';
  }

  return `<ul>${pairs.map(([key, value]) => `<li>${escapeHtml(key)}: ${escapeHtml(value)}</li>`).join('')}</ul>`;
};

/**
 * Renders the entries as an HTML page: the license-report table (extra columns appended) and, per package,
 * every detail with the full license file texts.
 * @param {Object[]} entries - License entries.
 * @param {Object} options - Options.
 * @param {string} options.title - Page title.
 * @return {string} HTML page.
 */
export const renderLicenseHtml = (entries, { title }) => {
  const columns = [...LEGACY_COLUMNS, ...EXTRA_COLUMNS];
  const header = columns.map(([, label]) => `<th class="string">${escapeHtml(label)}</th>`).join('');
  const rows = entries.map((entry, index) => {
    const cells = columns.map(([key]) => {
      const value = key === 'name' ? `<a href="#package-${index}">${escapeHtml(entry.name)}</a>` : escapeHtml(entry[key]);

      return `<td class="string">${value}</td>`;
    }).join('');

    return `<tr>${cells}</tr>`;
  }).join('\n');

  const details = entries.map((entry, index) => {
    const fields = [
      ['Required by', renderPairs(entry.requiredBy)],
      ['Copyright', escapeHtml(entry.copyright)],
      ['Designer', escapeHtml(entry.designer)],
      ['License description', escapeHtml(entry.licenseDescription)],
      ['License URL', escapeHtml(entry.licenseUrl)],
      ['Styles', escapeHtml(entry.styles)],
      ['Variation axes', escapeHtml(entry.axes)],
      ['Glyphs', escapeHtml(entry.glyphs)],
      ['Source', escapeHtml(entry.source)],
      ['Modifications', escapeHtml(entry.modifications)],
      ['SHA-256', renderPairs(entry.sha256)],
      ['Repository', escapeHtml(entry.repository)],
      ['Bugs', escapeHtml(entry.bugs)],
      ['Funding', escapeHtml(entry.funding)],
      ['Contributors', escapeHtml(entry.contributors)],
      ['Maintainers', escapeHtml(entry.maintainers)],
      ['Keywords', escapeHtml(entry.keywords)],
      ['Engines', renderPairs(entry.engines)],
      ['Dependencies', renderPairs(entry.dependencies)],
      ['Optional dependencies', renderPairs(entry.optionalDependencies)],
      ['Peer dependencies', renderPairs(entry.peerDependencies)],
      ['Deprecated', escapeHtml(entry.deprecated)],
      ['Resolved', escapeHtml(entry.resolved)],
      ['Integrity', escapeHtml(entry.integrity)],
      ['Paths', escapeHtml(entry.paths)],
      ['License files source', escapeHtml(entry.licenseFilesSource)]
    ].filter(([, value]) => value !== '');

    const files = Object.entries(entry.licenseFiles);
    const fileHtml = files.length > 0
      ? files.map(([name, text]) => `<h3>${escapeHtml(name)}</h3>\n<pre>${escapeHtml(text)}</pre>`).join('\n')
      : '<p>No license file in the package.</p>';

    return [
      `<section id="package-${index}">`,
      `<h2>${escapeHtml(entry.name)}@${escapeHtml(entry.installedVersion)} (${escapeHtml(entry.licenseType)})</h2>`,
      `<dl>${fields.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${value}</dd>`).join('')}</dl>`,
      fileHtml,
      '</section>'
    ].join('\n');
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
body {
  background: #fff;
  color: #000;
  font-family: Arial, sans-serif;
}

h1 {
  font-size: 40px;
  text-align: center;
}

table {
  margin: auto;
  width: 80%;
}

table,
th,
td {
  border: 1px solid #000;
  border-collapse: collapse;
}

th {
  background-color: #ddd;
}

th,
td {
  padding: 15px;
}

section {
  margin: 40px auto;
  width: 80%;
}

dt {
  font-weight: 700;
}

pre {
  background-color: #f4f4f4;
  overflow-x: auto;
  padding: 15px;
  white-space: pre-wrap;
}
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<table><thead><tr>${header}</tr></thead><tbody>
${rows}
</tbody></table>
${details}
</body>
</html>
`;
};
