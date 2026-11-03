// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import fs from 'node:fs';
import path from 'node:path';

const LICENSE_FILE_PATTERN = /^(?:(?:un)?licen[cs]e|copying|copyright|notice|patents|authors|third[-_ ]?party[-_ ]?notices?)(?:[-_.][\w.-]*)?$/i;

/**
 * Formats an npm person field ("author", "contributors", "maintainers").
 * @param {string|Object} person - Person as a string or { name, email, url }.
 * @return {string} Person as "Name <email> (url)".
 */
export const formatPerson = person => {
  if (!person) {
    return '';
  }

  if (typeof person === 'string') {
    return person.trim();
  }

  return [
    person.name,
    person.email ? `<${person.email}>` : '',
    person.url || person.web ? `(${person.url || person.web})` : ''
  ].filter(Boolean).join(' ');
};

/**
 * Formats a list of npm people.
 * @param {Array|string|Object} people - People list.
 * @return {string} People separated by "; ".
 */
export const formatPeople = people => {
  return [].concat(people || []).map(formatPerson).filter(Boolean).join('; ');
};

/**
 * Reads the license expression declared in package.json (also the deprecated "licenses" array).
 * @param {Object} pkg - Parsed package.json.
 * @return {string} License expression or 'n/a'.
 */
export const getLicenseType = pkg => {
  const license = pkg.license ?? pkg.licenses;

  if (Array.isArray(license)) {
    const types = license.map(item => (typeof item === 'string' ? item : item?.type)).filter(Boolean);

    return types.length > 0 ? (types.length > 1 ? `(${types.join(' OR ')})` : types[0]) : 'n/a';
  }

  if (license && typeof license === 'object') {
    return license.type || 'n/a';
  }

  return license ? String(license) : 'n/a';
};

/**
 * Returns the URL of an npm "repository", "bugs" or "funding" field.
 * @param {string|Object|Array} value - Field value.
 * @return {string} URL or an empty string.
 */
export const getUrl = value => {
  if (!value) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(getUrl).filter(Boolean).join(', ');
  }

  if (typeof value === 'string') {
    return value;
  }

  const url = value.url || value.email || '';

  return value.directory ? `${url} (directory: ${value.directory})` : url;
};

/**
 * Reads the full text of every license, notice and copyright file in a package folder,
 * including the file named by a "SEE LICENSE IN <file>" expression.
 * @param {string} dir - Package folder.
 * @param {string} licenseType - License expression from package.json.
 * @return {Object<string, string>} File name to file content.
 */
export const readLicenseFiles = (dir, licenseType) => {
  const files = {};
  let entries = [];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  const names = entries
    .filter(entry => entry.isFile() && LICENSE_FILE_PATTERN.test(entry.name))
    .map(entry => entry.name);

  const seeLicenseIn = /^SEE LICEN[CS]E IN (.+)$/i.exec(licenseType || '');

  if (seeLicenseIn) {
    const referenced = seeLicenseIn[1].trim();
    const referencedPath = path.resolve(dir, referenced);

    if (referencedPath.startsWith(dir + path.sep) && fs.existsSync(referencedPath) && fs.statSync(referencedPath).isFile()) {
      names.push(path.relative(dir, referencedPath));
    }
  }

  for (const name of [...new Set(names)].sort((a, b) => a.localeCompare(b))) {
    try {
      files[name] = fs.readFileSync(path.join(dir, name), 'utf8').replace(/\r\n?/g, '\n');
    } catch {}
  }

  return files;
};

/**
 * Reads the "License" section of the package README (used when the package ships no license file).
 * @param {string} dir - Package folder.
 * @return {Object<string, string>} "<readme> (License section)" to the section text, or an empty object.
 */
export const readReadmeLicenseSection = dir => {
  let name;

  try {
    name = fs.readdirSync(dir).find(fileName => /^readme(\.(md|markdown|txt))?$/i.test(fileName));
  } catch {
    return {};
  }

  if (!name) {
    return {};
  }

  let lines;

  try {
    lines = fs.readFileSync(path.join(dir, name), 'utf8').replace(/\r\n?/g, '\n').split('\n');
  } catch {
    return {};
  }

  const start = lines.findIndex(line => /^#{1,6}\s*licen[cs]e\b/i.test(line));

  if (start === -1) {
    return {};
  }

  const level = /^#+/.exec(lines[start])[0].length;
  const relativeEnd = lines.slice(start + 1).findIndex(line => {
    const heading = /^(#+)\s/.exec(line);

    return heading && heading[1].length <= level;
  });
  const section = lines.slice(start, relativeEnd === -1 ? lines.length : start + 1 + relativeEnd).join('\n').trim();

  return { [`${name} (License section)`]: section };
};

/**
 * Parses a yarn v1 lockfile into resolved/integrity data keyed by name@version.
 * @param {string} content - yarn.lock content.
 * @return {Map<string, { resolved: string, integrity: string }>} Lock data.
 */
export const parseYarnLock = content => {
  const result = new Map();
  let names = [];
  let current = null;

  /**
   * Stores the block that has just been read.
   * @return {void}
   */
  const flush = () => {
    if (current?.version) {
      for (const name of names) {
        result.set(`${name}@${current.version}`, { resolved: current.resolved || '', integrity: current.integrity || '' });
      }
    }

    names = [];
    current = null;
  };

  for (const line of content.split(/\r?\n/)) {
    if (line === '' || line.startsWith('#')) {
      continue;
    }

    if (!line.startsWith(' ')) {
      flush();
      names = [...new Set(line.replace(/:$/, '').split(/,\s*/).map(spec => {
        const unquoted = spec.trim().replace(/^"|"$/g, '');
        const at = unquoted.indexOf('@', 1);

        return at > 0 ? unquoted.slice(0, at) : unquoted;
      }))];
      current = {};
      continue;
    }

    const field = /^ {2}(version|resolved|integrity) "?([^"]*)"?$/.exec(line);

    if (field && current) {
      current[field[1]] = field[2];
    }
  }

  flush();

  return result;
};
