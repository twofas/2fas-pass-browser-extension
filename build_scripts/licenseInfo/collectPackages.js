// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DEPENDENCY_FIELDS = Object.freeze(['dependencies', 'devDependencies', 'optionalDependencies']);
const PACKAGE_DEPENDENCY_FIELDS = Object.freeze(['dependencies', 'optionalDependencies', 'peerDependencies']);

/**
 * Reads and parses a JSON file.
 * @param {string} filePath - Path of the JSON file.
 * @return {Object|null} Parsed content or null when the file is missing or invalid.
 */
const readJson = filePath => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
};

/**
 * Resolves an installed package the way Node does: the nearest node_modules folder up the tree, never above the project root.
 * @param {string} fromDir - Folder of the package that requires the dependency.
 * @param {string} name - Dependency name.
 * @param {string} rootDir - Project root.
 * @return {string|null} Real path of the dependency folder or null when it is not installed.
 */
export const resolvePackageDir = (fromDir, name, rootDir) => {
  let dir = fromDir;

  while (true) {
    if (path.basename(dir) !== 'node_modules') {
      const candidate = path.join(dir, 'node_modules', name);

      if (fs.existsSync(path.join(candidate, 'package.json'))) {
        return fs.realpathSync(candidate);
      }
    }

    if (dir === rootDir || dir === path.dirname(dir)) {
      return null;
    }

    dir = path.dirname(dir);
  }
};

/**
 * Lists the dependency edges declared by a package.
 * @param {Object} pkg - Parsed package.json.
 * @param {string[]} fields - package.json fields to read.
 * @return {Array<{ name: string, range: string, field: string }>} Declared dependencies.
 */
const getDeclaredDependencies = (pkg, fields) => {
  const edges = [];
  const seen = new Set();

  for (const field of fields) {
    for (const [name, range] of Object.entries(pkg[field] || {})) {
      if (seen.has(name)) {
        continue;
      }

      seen.add(name);
      edges.push({ name, range: String(range), field });
    }
  }

  return edges;
};

/**
 * Walks the installed dependency graph of the project, starting from its package.json, through every nesting level.
 * Only packages reachable from the project are returned, one record per installed name@version.
 * @param {string} rootDir - Project root (folder with package.json and node_modules).
 * @return {{ rootPackage: Object, packages: Object[], missing: string[] }} Collected packages and required dependencies that are not installed.
 */
const collectPackages = rootDir => {
  const root = fs.realpathSync(rootDir);
  const rootPackage = readJson(path.join(root, 'package.json'));

  if (!rootPackage) {
    throw new Error(`Cannot read ${path.join(root, 'package.json')}`);
  }

  const rootId = `${rootPackage.name}@${rootPackage.version}`;
  const records = new Map();
  const dirs = new Map();
  const missing = new Set();
  const queue = [];

  /**
   * Returns the record of the package installed in a folder, creating it on first visit.
   * @param {string} dir - Real path of the package folder.
   * @return {Object|null} Package record or null when the folder holds no valid package.
   */
  const getRecord = dir => {
    if (dirs.has(dir)) {
      return dirs.get(dir);
    }

    const pkg = readJson(path.join(dir, 'package.json'));

    if (!pkg || !pkg.name || !pkg.version) {
      dirs.set(dir, null);
      return null;
    }

    const key = `${pkg.name}@${pkg.version}`;
    let record = records.get(key);

    if (!record) {
      record = {
        key,
        name: pkg.name,
        version: pkg.version,
        pkg,
        dir,
        dirs: new Set(),
        direct: false,
        rootRange: null,
        rootField: null,
        scopes: new Set(),
        depth: Infinity,
        requiredBy: new Map()
      };
      records.set(key, record);
    }

    record.dirs.add(dir);
    dirs.set(dir, record);

    return record;
  };

  /**
   * Links a dependency to the package that requires it and schedules its own dependencies.
   * @param {Object} edge - Dependency edge.
   * @param {string} fromDir - Folder of the requiring package.
   * @param {string} parentId - name@version of the requiring package.
   * @param {string} scope - 'dependencies' or 'devDependencies' (the project-level group the edge belongs to).
   * @param {number} depth - Depth of the dependency (1 = declared by the project).
   * @return {void}
   */
  const link = (edge, fromDir, parentId, scope, depth) => {
    const dir = resolvePackageDir(fromDir, edge.name, root);
    const record = dir ? getRecord(dir) : null;

    if (!record) {
      if (edge.field === 'dependencies' || edge.field === 'devDependencies') {
        missing.add(`${edge.name}@${edge.range} (required by ${parentId})`);
      }

      return;
    }

    const ranges = record.requiredBy.get(parentId) || new Set();
    ranges.add(edge.range);
    record.requiredBy.set(parentId, ranges);

    const visitKey = `${dir}\u0000${scope}`;
    const isNewVisit = !record.scopes.has(visitKey) || depth < record.depth;

    record.scopes.add(visitKey);
    record.depth = Math.min(record.depth, depth);

    if (isNewVisit) {
      queue.push({ record, dir, scope, depth });
    }
  };

  for (const edge of getDeclaredDependencies(rootPackage, ROOT_DEPENDENCY_FIELDS)) {
    const scope = edge.field === 'devDependencies' ? 'devDependencies' : 'dependencies';
    const dir = resolvePackageDir(root, edge.name, root);
    const record = dir ? getRecord(dir) : null;

    if (record) {
      record.direct = true;
      record.rootRange = edge.range;
      record.rootField = edge.field;
    }

    link(edge, root, rootId, scope, 1);
  }

  while (queue.length > 0) {
    const { record, dir, scope, depth } = queue.shift();
    const pkg = readJson(path.join(dir, 'package.json'));

    for (const edge of getDeclaredDependencies(pkg, PACKAGE_DEPENDENCY_FIELDS)) {
      if (edge.name === record.name) {
        continue;
      }

      link(edge, dir, record.key, scope, depth + 1);
    }
  }

  const packages = [...records.values()].map(record => {
    const scopes = new Set([...record.scopes].map(visitKey => visitKey.split('\u0000')[1]));

    return {
      ...record,
      dirs: [...record.dirs].map(dir => path.relative(root, dir)).sort(),
      dependencyType: scopes.has('dependencies') ? 'dependencies' : 'devDependencies',
      requiredBy: Object.fromEntries(
        [...record.requiredBy.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([parentId, ranges]) => [parentId, [...ranges].join(', ')])
      )
    };
  });

  return { rootPackage, packages, missing: [...missing].sort() };
};

export default collectPackages;
