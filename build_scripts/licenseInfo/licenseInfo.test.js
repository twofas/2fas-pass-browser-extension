// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import collectPackages from './collectPackages.js';
import fetchRemoteVersions from './fetchRemoteVersions.js';
import fetchRepositoryLicenseFiles, { parseGitHubRepository } from './fetchRepositoryLicenseFiles.js';
import { LEGACY_COLUMNS, buildEntries, renderLicenseHtml, serializeLicenseJson } from './formatLicenseInfo.js';
import { formatPerson, getLicenseType, parseYarnLock, readLicenseFiles, readReadmeLicenseSection } from './readPackageDetails.js';
import { generateLicenseInfo } from '../generateLicenseInfo.js';

const APACHE_APPENDIX = 'Copyright [yyyy] [name of copyright owner]';

let root;

/**
 * Writes a file (and its parent folders) inside the temporary project.
 * @param {string} relativePath - Path relative to the project root.
 * @param {string|Object} content - File content (objects are written as JSON).
 * @return {void}
 */
const writeProjectFile = (relativePath, content) => {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, typeof content === 'string' ? content : JSON.stringify(content));
};

/**
 * Creates an installed package in the temporary project.
 * @param {string} folder - Package folder relative to the project root.
 * @param {Object} pkg - package.json content.
 * @param {Object<string, string>} [files] - Extra files of the package.
 * @return {void}
 */
const installPackage = (folder, pkg, files = {}) => {
  writeProjectFile(path.join(folder, 'package.json'), pkg);

  for (const [name, content] of Object.entries(files)) {
    writeProjectFile(path.join(folder, name), content);
  }
};

/**
 * Builds a project where:
 * - "alpha" (dependency) needs "beta@^1", installed nested under alpha,
 * - "beta@2" is a direct devDependency (hoisted),
 * - "gamma" is required by beta@1 and resolved from the root node_modules,
 * - "orphan" sits in node_modules but nothing requires it,
 * - "missing-optional" is an optional dependency that is not installed.
 * @return {void}
 */
const createProject = () => {
  writeProjectFile('package.json', {
    name: 'test-project',
    version: '1.0.0',
    dependencies: { alpha: '^1.0.0' },
    devDependencies: { beta: '^2.0.0' }
  });

  installPackage('node_modules/alpha', {
    name: 'alpha',
    version: '1.2.0',
    license: 'MIT',
    description: 'Alpha package',
    author: { name: 'Alice', email: 'alice@example.com', url: 'https://alice.example.com' },
    repository: { type: 'git', url: 'git+https://github.com/example/alpha.git' },
    keywords: ['first', 'second'],
    dependencies: { beta: '^1.0.0' },
    optionalDependencies: { 'missing-optional': '^1.0.0' }
  }, {
    LICENSE: `MIT License\n\n${APACHE_APPENDIX}\r\n`,
    NOTICE: 'Alpha notice'
  });

  installPackage('node_modules/alpha/node_modules/beta', {
    name: 'beta',
    version: '1.0.0',
    license: 'ISC',
    dependencies: { gamma: '~3.0.0' }
  }, { 'license.md': 'ISC text' });

  installPackage('node_modules/beta', { name: 'beta', version: '2.1.0', license: 'Apache-2.0' }, { LICENSE: 'Apache text' });
  installPackage('node_modules/gamma', { name: 'gamma', version: '3.0.4', licenses: [{ type: 'MIT' }, { type: 'GPL-2.0' }] }, { 'README.md': '# gamma\n\n## License\n\nMIT\n\n## Other\n\nx' });
  installPackage('node_modules/orphan', { name: 'orphan', version: '9.9.9', license: 'MIT' }, { LICENSE: 'orphan' });

  writeProjectFile('yarn.lock', [
    '# yarn lockfile v1',
    '',
    'alpha@^1.0.0:',
    '  version "1.2.0"',
    '  resolved "https://registry.yarnpkg.com/alpha/-/alpha-1.2.0.tgz#abc"',
    '  integrity sha512-alpha',
    '',
    '"beta@^1.0.0":',
    '  version "1.0.0"',
    '  resolved "https://registry.yarnpkg.com/beta/-/beta-1.0.0.tgz#def"',
    '  integrity sha512-beta1',
    ''
  ].join('\n'));
};

/**
 * Creates a fetch mock answering the npm registry dist-tags endpoint.
 * @param {Object<string, string>} latest - Latest version per package name.
 * @return {Function} fetch mock.
 */
const createRegistryFetch = latest => {
  return vi.fn(async url => {
    const name = decodeURIComponent(/\/-\/package\/(.+)\/dist-tags$/.exec(url)?.[1] || '');

    if (latest[name]) {
      return { ok: true, status: 200, json: async () => ({ latest: latest[name] }) };
    }

    return { ok: false, status: 404 };
  });
};

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'license-info-'));
  createProject();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('collectPackages', () => {
  it('returns only the installed versions reachable from package.json, through every nesting level', () => {
    const { packages, missing } = collectPackages(root);
    const keys = packages.map(record => record.key).sort();

    expect(keys).toEqual(['alpha@1.2.0', 'beta@1.0.0', 'beta@2.1.0', 'gamma@3.0.4']);
    expect(missing).toEqual([]);
  });

  it('marks direct packages, the dependency group, depth and who requires each package', () => {
    const { packages } = collectPackages(root);
    const byKey = Object.fromEntries(packages.map(record => [record.key, record]));

    expect(byKey['alpha@1.2.0']).toMatchObject({ direct: true, rootRange: '^1.0.0', dependencyType: 'dependencies', depth: 1 });
    expect(byKey['beta@2.1.0']).toMatchObject({ direct: true, rootRange: '^2.0.0', dependencyType: 'devDependencies', depth: 1 });
    expect(byKey['beta@1.0.0']).toMatchObject({ direct: false, dependencyType: 'dependencies', depth: 2, requiredBy: { 'alpha@1.2.0': '^1.0.0' } });
    expect(byKey['gamma@3.0.4']).toMatchObject({ depth: 3, requiredBy: { 'beta@1.0.0': '~3.0.0' } });
    expect(byKey['beta@1.0.0'].dirs).toEqual([path.join('node_modules', 'alpha', 'node_modules', 'beta')]);
  });

  it('reports a required dependency that is not installed', () => {
    installPackage('node_modules/beta', { name: 'beta', version: '2.1.0', dependencies: { absent: '^1.0.0' } });

    expect(collectPackages(root).missing).toEqual(['absent@^1.0.0 (required by beta@2.1.0)']);
  });
});

describe('buildEntries and serializeLicenseJson', () => {
  /**
   * Builds the entries of the test project.
   * @return {Object[]} Entries.
   */
  const build = () => {
    const { packages } = collectPackages(root);

    return buildEntries(packages, {
      rootDir: root,
      remoteVersions: new Map([['alpha', '1.3.0']]),
      lock: parseYarnLock(readFileSync(path.join(root, 'yarn.lock'), 'utf8'))
    });
  };

  it('keeps the license-report fields first, in their original order', () => {
    const [alpha] = build();

    expect(Object.keys(alpha).slice(0, LEGACY_COLUMNS.length)).toEqual(LEGACY_COLUMNS.map(([key]) => key));
    expect(alpha).toMatchObject({
      department: 'kessler',
      relatedTo: 'stuff',
      name: 'alpha',
      licensePeriod: 'perpetual',
      material: 'material',
      licenseType: 'MIT',
      link: 'git+https://github.com/example/alpha.git',
      remoteVersion: '1.3.0',
      installedVersion: '1.2.0',
      definedVersion: '^1.0.0',
      author: 'Alice <alice@example.com> (https://alice.example.com)'
    });
  });

  it('adds the package details, lock data and full license file texts', () => {
    const entries = build();
    const alpha = entries.find(entry => entry.name === 'alpha');
    const beta1 = entries.find(entry => entry.name === 'beta' && entry.installedVersion === '1.0.0');
    const gamma = entries.find(entry => entry.name === 'gamma');

    expect(alpha).toMatchObject({
      description: 'Alpha package',
      keywords: 'first, second',
      resolved: 'https://registry.yarnpkg.com/alpha/-/alpha-1.2.0.tgz#abc',
      integrity: 'sha512-alpha',
      licenseFilesSource: 'package',
      licenseFiles: { LICENSE: `MIT License\n\n${APACHE_APPENDIX}\n`, NOTICE: 'Alpha notice' }
    });
    expect(beta1).toMatchObject({ definedVersion: '^1.0.0', remoteVersion: 'n/a', licenseFiles: { 'license.md': 'ISC text' } });
    expect(gamma).toMatchObject({
      licenseType: '(MIT OR GPL-2.0)',
      licenseFilesSource: 'package-readme',
      licenseFiles: { 'README.md (License section)': '## License\n\nMIT' }
    });
  });

  it('writes no "]" before the end of the array, so 2fas.com can read it with split(\']\')', () => {
    const entries = build();
    const json = serializeLicenseJson(entries);
    const asReadBy2fasCom = JSON.parse(json.split(']')[0] + ']');

    expect(asReadBy2fasCom).toEqual(JSON.parse(json));
    expect(asReadBy2fasCom).toEqual(JSON.parse(JSON.stringify(entries)));
    expect(asReadBy2fasCom[0].licenseFiles.LICENSE).toContain(APACHE_APPENDIX);
  });

  it('escapes license texts in the HTML page', () => {
    const entries = build();
    entries[0].licenseFiles.LICENSE = '<script>alert(1)</script>';

    const html = renderLicenseHtml(entries, { title: 'Licenses' });

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('<th class="string">installed version</th>');
  });
});

describe('readPackageDetails', () => {
  it('reads license, notice and "SEE LICENSE IN" files only', () => {
    installPackage('node_modules/delta', { name: 'delta', version: '1.0.0' }, {
      'LICENSE-MIT': 'mit',
      COPYING: 'copying',
      'ThirdPartyNotices.txt': 'notices',
      'terms.txt': 'custom terms',
      'index.js': 'code',
      'licenseChecker.js': 'code'
    });
    mkdirSync(path.join(root, 'node_modules/delta/license'));

    expect(readLicenseFiles(path.join(root, 'node_modules/delta'), 'SEE LICENSE IN terms.txt')).toEqual({
      COPYING: 'copying',
      'LICENSE-MIT': 'mit',
      'terms.txt': 'custom terms',
      'ThirdPartyNotices.txt': 'notices'
    });
  });

  it('never reads a "SEE LICENSE IN" file outside the package', () => {
    writeProjectFile('secret.txt', 'secret');

    expect(readLicenseFiles(path.join(root, 'node_modules/orphan'), 'SEE LICENSE IN ../../secret.txt')).toEqual({ LICENSE: 'orphan' });
  });

  it('formats people and license expressions', () => {
    expect(formatPerson('Bob <bob@example.com>')).toBe('Bob <bob@example.com>');
    expect(formatPerson({ name: 'Bob' })).toBe('Bob');
    expect(getLicenseType({ license: { type: 'BSD' } })).toBe('BSD');
    expect(getLicenseType({ licenses: ['MIT'] })).toBe('MIT');
    expect(getLicenseType({})).toBe('n/a');
  });

  it('parses scoped and multi-range yarn.lock headers', () => {
    const lock = parseYarnLock([
      '"@scope/pkg@^1.0.0", "@scope/pkg@^1.1.0":',
      '  version "1.1.2"',
      '  resolved "https://example.com/pkg.tgz"',
      '  integrity sha512-x'
    ].join('\n'));

    expect(lock.get('@scope/pkg@1.1.2')).toEqual({ resolved: 'https://example.com/pkg.tgz', integrity: 'sha512-x' });
  });

  it('returns no README section when the README has no license heading', () => {
    expect(readReadmeLicenseSection(path.join(root, 'node_modules/beta'))).toEqual({});
  });
});

describe('fetchRemoteVersions', () => {
  it('retries rate-limited requests', async () => {
    let calls = 0;
    const fetchFn = vi.fn(async () => {
      calls += 1;

      return calls === 1
        ? { ok: false, status: 429, headers: new Headers() }
        : { ok: true, status: 200, json: async () => ({ latest: '2.0.0' }) };
    });

    const versions = await fetchRemoteVersions(['@scope/pkg'], fetchFn, 1);

    expect(versions.get('@scope/pkg')).toBe('2.0.0');
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn.mock.calls[0][0]).toBe('https://registry.npmjs.org/-/package/@scope%2fpkg/dist-tags');
  });

  it('skips packages the registry does not know', async () => {
    const versions = await fetchRemoteVersions(['unknown'], createRegistryFetch({}), 1);

    expect(versions.size).toBe(0);
  });
});

describe('fetchRepositoryLicenseFiles', () => {
  it('parses GitHub repository forms', () => {
    expect(parseGitHubRepository('git+https://github.com/wxt-dev/wxt.git (directory: packages/storage)')).toEqual({ owner: 'wxt-dev', repo: 'wxt', directory: 'packages/storage' });
    expect(parseGitHubRepository('git://github.com/juliangruber/isarray.git')).toEqual({ owner: 'juliangruber', repo: 'isarray', directory: '' });
    expect(parseGitHubRepository('git@github.com:owner/repo.git')).toEqual({ owner: 'owner', repo: 'repo', directory: '' });
    expect(parseGitHubRepository('sass/embedded-host-node')).toEqual({ owner: 'sass', repo: 'embedded-host-node', directory: '' });
    expect(parseGitHubRepository('https://gitlab.com/owner/repo')).toBeNull();
  });

  it('adds the repository license to packages without a license file, keeping the README section', async () => {
    const entry = {
      installedVersion: '3.0.4',
      repository: 'https://github.com/example/mono.git (directory: packages/gamma)',
      licenseFilesSource: 'package-readme',
      licenseFiles: { 'README.md (License section)': 'MIT' }
    };
    const fetchFn = vi.fn(async url => {
      return url === 'https://raw.githubusercontent.com/example/mono/HEAD/LICENSE'
        ? { ok: true, status: 200, text: async () => 'MIT License\r\n' }
        : { ok: false, status: 404 };
    });

    await fetchRepositoryLicenseFiles([entry, { licenseFilesSource: 'package', licenseFiles: { LICENSE: 'x' } }], fetchFn);

    expect(entry.licenseFiles).toEqual({ LICENSE: 'MIT License\n', 'README.md (License section)': 'MIT' });
    expect(entry.licenseFilesSource).toBe('https://github.com/example/mono/blob/HEAD/LICENSE');
    expect(fetchFn.mock.calls[0][0]).toBe('https://raw.githubusercontent.com/example/mono/v3.0.4/packages/gamma/LICENSE');
  });
});

describe('generateLicenseInfo', () => {
  it('overwrites the JSON and HTML files instead of appending to them', async () => {
    const outDir = path.join(root, 'out');
    const fetchFn = createRegistryFetch({ alpha: '1.3.0', beta: '2.2.0', gamma: '3.1.0' });

    mkdirSync(outDir);
    writeFileSync(path.join(outDir, 'open-source-licenses.json'), '[{"name":"stale"}]');

    await generateLicenseInfo({ rootDir: root, outDir, fetchFn });
    await generateLicenseInfo({ rootDir: root, outDir, fetchFn });

    const json = readFileSync(path.join(outDir, 'open-source-licenses.json'), 'utf8');
    const entries = JSON.parse(json);

    expect(entries.map(entry => `${entry.name}@${entry.installedVersion}`)).toEqual(['alpha@1.2.0', 'beta@1.0.0', 'beta@2.1.0', 'gamma@3.0.4']);
    expect(entries.map(entry => entry.remoteVersion)).toEqual(['1.3.0', '2.2.0', '2.2.0', '3.1.0']);
    expect(readFileSync(path.join(outDir, 'open-source-licenses.html'), 'utf8').match(/<table>/g)).toHaveLength(1);
  });

  it('reuses the network data of packages whose installed version has not changed', async () => {
    const outDir = path.join(root, 'out');
    const repositoryFetch = vi.fn(async url => {
      if (url.startsWith('https://raw.githubusercontent.com/example/gamma/v3.0.4/')) {
        return url.endsWith('/LICENSE') ? { ok: true, status: 200, text: async () => 'Gamma license' } : { ok: false, status: 404 };
      }

      return createRegistryFetch({ alpha: '1.3.0', beta: '2.2.0', gamma: '3.1.0' })(url);
    });

    installPackage('node_modules/gamma', { name: 'gamma', version: '3.0.4', license: 'MIT', repository: 'example/gamma' });
    await generateLicenseInfo({ rootDir: root, outDir, fetchFn: repositoryFetch });

    installPackage('node_modules/alpha', {
      name: 'alpha',
      version: '1.2.1',
      license: 'MIT',
      dependencies: { beta: '^1.0.0' }
    }, { LICENSE: 'MIT License' });

    const fetchFn = createRegistryFetch({ alpha: '1.4.0', beta: '9.9.9', gamma: '9.9.9' });
    const { entries, reused } = await generateLicenseInfo({ rootDir: root, outDir, fetchFn });
    const byKey = Object.fromEntries(entries.map(entry => [`${entry.name}@${entry.installedVersion}`, entry]));

    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual(['https://registry.npmjs.org/-/package/alpha/dist-tags']);
    expect(reused).toEqual({ remoteVersions: 2, licenseFiles: 1 });
    expect(byKey['alpha@1.2.1'].remoteVersion).toBe('1.4.0');
    expect(byKey['beta@2.1.0'].remoteVersion).toBe('2.2.0');
    expect(byKey['gamma@3.0.4']).toMatchObject({
      remoteVersion: '3.1.0',
      licenseFilesSource: 'https://github.com/example/gamma/blob/v3.0.4/LICENSE',
      licenseFiles: { LICENSE: 'Gamma license' }
    });
  });

  it('fetches everything again with refresh, or when the previous file is the old appended format', async () => {
    const outDir = path.join(root, 'out');

    mkdirSync(outDir);
    writeFileSync(path.join(outDir, 'open-source-licenses.json'), '[{"name":"alpha","installedVersion":"1.2.0","remoteVersion":"0.0.1"}][{"name":"alpha"}]');

    const fetchFn = createRegistryFetch({ alpha: '1.3.0', beta: '2.2.0', gamma: '3.1.0' });
    const first = await generateLicenseInfo({ rootDir: root, outDir, fetchFn });

    expect(first.reused.remoteVersions).toBe(0);
    expect(first.entries[0].remoteVersion).toBe('1.3.0');

    fetchFn.mockClear();
    const second = await generateLicenseInfo({ rootDir: root, outDir, refresh: true, fetchFn });

    expect(second.reused).toEqual({ remoteVersions: 0, licenseFiles: 0 });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('works offline', async () => {
    const outDir = path.join(root, 'out');
    const fetchFn = vi.fn();
    const { entries, files } = await generateLicenseInfo({ rootDir: root, outDir, format: 'json', offline: true, fetchFn });

    expect(fetchFn).not.toHaveBeenCalled();
    expect(entries.every(entry => entry.remoteVersion === 'n/a')).toBe(true);
    expect(files).toEqual([path.join(outDir, 'open-source-licenses.json')]);
  });
});
