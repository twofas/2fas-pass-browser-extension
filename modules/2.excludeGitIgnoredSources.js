// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { execFileSync } from 'node:child_process';
import { defineWxtModule } from 'wxt/modules';

// WXT turns every "\" in excludeSources into "/", so glob characters are escaped as one-character classes.
// A leading "!" cannot be escaped that way ("[!]" opens a negated class).
const GLOB_CHARACTERS = /[*?[\]{}()+@]/g;
const UNESCAPABLE_PATH = /^!|\\/;

/**
 * Converts a path printed by `git ls-files` into a glob that matches only that path.
 * @param {string} gitPath - Path relative to the repository root; folders end with "/".
 * @return {string} The exclude glob.
 */
const toExcludeGlob = gitPath => {
  if (UNESCAPABLE_PATH.test(gitPath)) {
    throw new Error(`The git-ignored path "${gitPath}" cannot be excluded from the sources zip. Rename it or delete it.`);
  }

  const glob = gitPath.replace(GLOB_CHARACTERS, character => `[${character}]`);

  return glob.endsWith('/') ? `${glob}**` : glob;
};

/**
 * Lists the git-ignored files and folders of the project (.gitignore files, .git/info/exclude and the global excludes file).
 * @param {string} root - Project root.
 * @return {string[]} Paths relative to the root; folders end with "/".
 */
const listGitIgnoredPaths = root => {
  try {
    const output = execFileSync('git', ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory', '-z'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });

    return output.split('\0').filter(Boolean);
  } catch (e) {
    throw new Error('Cannot list git-ignored files for the sources zip. Run the zip inside the git repository.', { cause: e });
  }
};

export default defineWxtModule({
  setup (wxt) {
    wxt.hook('zip:start', wxt => {
      if (!wxt.config.zip.zipSources) {
        return;
      }

      const excludeGlobs = listGitIgnoredPaths(wxt.config.zip.sourcesRoot).map(toExcludeGlob);
      wxt.config.zip.excludeSources.push(...excludeGlobs);
    });
  }
});
