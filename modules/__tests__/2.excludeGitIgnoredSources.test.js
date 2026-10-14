// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { env } from 'node:process';
import { glob } from 'tinyglobby';
import excludeGitIgnoredSources from '../2.excludeGitIgnoredSources.js';

let root;

/**
 * Writes a file (and its parent folders) inside the temporary project.
 * @param {string} relativePath - Path relative to the project root.
 * @param {string} [content] - File content.
 * @return {void}
 */
const writeProjectFile = (relativePath, content = 'x') => {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content);
};

/**
 * Runs the module's zip:start hook against a fake WXT instance.
 * @param {Object} options - Options.
 * @param {boolean} options.zipSources - Whether the browser zips sources.
 * @return {Promise<string[]>} The resulting excludeSources list.
 */
const runZipStart = async ({ zipSources }) => {
  const hooks = {};
  const wxt = {
    config: { zip: { zipSources, sourcesRoot: root, excludeSources: ['**/node_modules'] } },
    hook: (name, callback) => {
      hooks[name] = callback;
    }
  };

  excludeGitIgnoredSources.setup(wxt);
  await hooks['zip:start'](wxt);

  return wxt.config.zip.excludeSources;
};

/**
 * Lists the files WXT would put into the sources zip (same glob call as WXT's zipDir).
 * @param {string[]} excludeSources - Exclude globs.
 * @return {Promise<string[]>} Sorted relative file paths.
 */
const listSourcesZipFiles = async excludeSources => {
  const files = await glob(['**/*'], { cwd: root, ignore: excludeSources, onlyFiles: true, dot: false });
  return files.sort();
};

describe('modules/2.excludeGitIgnoredSources', () => {
  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'twofas-sources-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('leaves git-ignored files and folders out of the sources zip', async () => {
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    writeProjectFile('.gitignore', 'testFiles\nartifacts/\nCLAUDE.md\nAGENTS.md\nnotes.md\n*.log\nmobile-mock\n');
    writeProjectFile('package.json', '{}');
    writeProjectFile('entrypoints/popup/main.jsx');
    writeProjectFile('entrypoints/popup/notes.md');
    writeProjectFile('README.md');
    writeProjectFile('testFiles/plans/plan.md');
    writeProjectFile('testFiles/trace.json');
    writeProjectFile('artifacts/report.html');
    writeProjectFile('CLAUDE.md');
    writeProjectFile('AGENTS.md');
    writeProjectFile('notes.md');
    writeProjectFile('yarn-error.log');
    writeProjectFile('mobile-mock/server.js');
    writeProjectFile('utils/debug.log');

    const files = await listSourcesZipFiles(await runZipStart({ zipSources: true }));

    expect(files).toEqual(['README.md', 'entrypoints/popup/main.jsx', 'package.json']);
  });

  it('matches ignored paths literally, even with glob characters in their names', async () => {
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    writeProjectFile('.gitignore', '/b[[]1]\n/a (x)\n/c{d,e}\n/g+h@i\n');
    writeProjectFile('b[1]/f.js');
    writeProjectFile('b1/f.js');
    writeProjectFile('a (x)/f.js');
    writeProjectFile('a x/f.js');
    writeProjectFile('c{d,e}/f.js');
    writeProjectFile('cd/f.js');
    writeProjectFile('g+h@i/f.js');
    writeProjectFile('ghi/f.js');

    const files = await listSourcesZipFiles(await runZipStart({ zipSources: true }));

    expect(files).toEqual(['a x/f.js', 'b1/f.js', 'cd/f.js', 'ghi/f.js']);
  });

  it('refuses an ignored path that starts with "!" instead of zipping it', async () => {
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    writeProjectFile('.gitignore', '/\\!secret\n');
    writeProjectFile('!secret/f.js');

    await expect(runZipStart({ zipSources: true })).rejects.toThrow('!secret');
  });

  it('fails the zip when git cannot list ignored files', async () => {
    const previousCeiling = env.GIT_CEILING_DIRECTORIES;
    env.GIT_CEILING_DIRECTORIES = path.dirname(root);
    writeProjectFile('testFiles/trace.json');

    try {
      await expect(runZipStart({ zipSources: true })).rejects.toThrow('sources zip');
    } finally {
      if (previousCeiling === undefined) {
        delete env.GIT_CEILING_DIRECTORIES;
      } else {
        env.GIT_CEILING_DIRECTORIES = previousCeiling;
      }
    }
  });

  it('does nothing for browsers without a sources zip', async () => {
    const excludeSources = await runZipStart({ zipSources: false });

    expect(excludeSources).toEqual(['**/node_modules']);
  });
});
