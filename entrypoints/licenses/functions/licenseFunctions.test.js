// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, expect, it } from 'vitest';
import getEntryDetails, { getSafeUrl } from './getEntryDetails';
import { filterLicenses, getLicenseGroup, summarizeLicenses } from './licenseGroups';

const ENTRIES = Object.freeze([
  { name: 'react', installedVersion: '19.3.1', licenseType: 'MIT', dependencyType: 'dependencies', description: 'UI library', author: 'Meta', keywords: 'react', licenseFiles: { LICENSE: 'MIT text' } },
  { name: 'eslint', installedVersion: '10.13.0', licenseType: 'MIT', dependencyType: 'devDependencies', description: 'Linter', author: 'Nicholas', keywords: 'lint', licenseFiles: { LICENSE: 'MIT text' } },
  { name: 'winreg', installedVersion: '0.0.12', licenseType: 'BSD', dependencyType: 'devDependencies', description: 'Registry', author: '', licenseFiles: {} },
  { name: 'Inter (font)', installedVersion: '4.001', licenseType: 'OFL-1.1', dependencyType: 'font', description: '', author: 'Rasmus Andersson', licenseFiles: { 'OFL-Inter.txt': 'OFL' } }
]);

describe('licenseGroups', () => {
  it('maps the dependency type to a group', () => {
    expect(ENTRIES.map(getLicenseGroup)).toEqual(['extension', 'development', 'development', 'fonts']);
    expect(getLicenseGroup({ dependencyType: 'peer' })).toBe('other');
  });

  it('counts the entries per group', () => {
    expect(summarizeLicenses(ENTRIES)).toEqual({
      total: 4,
      groups: { extension: 1, development: 2, fonts: 1, other: 0 }
    });
  });

  it('filters by group and every search word', () => {
    const names = filters => filterLicenses(ENTRIES, { group: null, query: '', ...filters }).map(entry => entry.name);

    expect(names({ group: 'development' })).toEqual(['eslint', 'winreg']);
    expect(names({ query: 'RASMUS' })).toEqual(['Inter (font)']);
    expect(names({ query: 'mit linter' })).toEqual(['eslint']);
    expect(names({ query: '19.3' })).toEqual(['react']);
    expect(names({ group: 'fonts', query: 'mit' })).toEqual([]);
  });
});

describe('getEntryDetails', () => {
  it('lists the non-empty fields in display order, objects as pairs, without license-report placeholders', () => {
    const details = getEntryDetails({
      department: 'kessler',
      relatedTo: 'stuff',
      name: 'pkg',
      licensePeriod: 'perpetual',
      material: 'material',
      licenseType: 'MIT',
      link: 'git+https://github.com/o/pkg.git',
      remoteVersion: 'n/a',
      installedVersion: '1.0.0',
      definedVersion: '^1.0.0',
      author: '',
      direct: false,
      depth: 2,
      requiredBy: { 'root@1.0.0': '^1.0.0' },
      dependencies: {},
      repository: 'git+https://github.com/o/pkg.git',
      licenseFiles: { LICENSE: 'x' }
    });

    expect(details.map(detail => detail.key)).toEqual(['installedVersion', 'definedVersion', 'licenseType', 'repository', 'direct', 'depth', 'requiredBy']);
    expect(details.find(detail => detail.key === 'requiredBy')).toEqual({ key: 'requiredBy', label: 'licenses_field_required_by', kind: 'pairs', value: [['root@1.0.0', '^1.0.0']] });
    expect(details.find(detail => detail.key === 'direct').value).toBe('false');
  });

  it('links only http(s) URLs', () => {
    expect(getSafeUrl('git+https://github.com/o/pkg.git')).toBe('https://github.com/o/pkg');
    expect(getSafeUrl('https://github.com/o/pkg.git (directory: packages/a)')).toBe('https://github.com/o/pkg');
    expect(getSafeUrl('http://scripts.sil.org/OFL')).toBe('http://scripts.sil.org/OFL');
    expect(getSafeUrl('javascript:alert(1)')).toBeNull();
    expect(getSafeUrl('git://github.com/o/pkg.git')).toBeNull();
    expect(getSafeUrl('MIT')).toBeNull();
  });
});
