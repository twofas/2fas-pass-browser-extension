// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const migrationModules = import.meta.glob('./migrationsDatabase/*.js', { eager: true });

const MIGRATION_VERSION_KEY = 'local:migrationVersion';

const getMigrationIndex = path => {
  const fileName = path.split('/').pop();

  return parseInt(fileName.match(/^(\d+)/)?.[1] ?? '-1', 10);
};

/**
* Function to run migrations for the browser. Tracks the highest applied
* migration index in `local:migrationVersion` so that already-applied
* migrations are skipped on subsequent invocations (e.g. dev reloads).
* @async
* @return {Promise<void>} A promise that resolves when the migrations are complete.
*/
const runMigrations = async () => {
  const sortedMigrations = Object.entries(migrationModules)
    .map(([path, migration]) => ({ path, migration, index: getMigrationIndex(path) }))
    .filter(item => item.index >= 0 && typeof item.migration.default === 'function')
    .sort((a, b) => a.index - b.index);

  const storedVersion = await storage.getItem(MIGRATION_VERSION_KEY);
  const appliedVersion = typeof storedVersion === 'number' ? storedVersion : -1;
  const pending = sortedMigrations.filter(item => item.index > appliedVersion);

  if (pending.length === 0) {
    return;
  }

  logger.info(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'StorageMigrations - run start', { count: pending.length, from: appliedVersion });

  let lastApplied = appliedVersion;

  for (const { path, migration, index } of pending) {
    const fileName = path.split('/').pop();

    try {
      await migration.default();
      lastApplied = index;
      logger.info(LOGGER_CONSTANTS.CATEGORIES.STORAGE, `StorageMigrations - ${fileName} completed`);
    } catch (e) {
      logger.error(LOGGER_CONSTANTS.CATEGORIES.STORAGE, `StorageMigrations - ${fileName} failed`, { errorName: e?.name });

      if (lastApplied > appliedVersion) {
        await storage.setItem(MIGRATION_VERSION_KEY, lastApplied);
      }

      throw e;
    }
  }

  await storage.setItem(MIGRATION_VERSION_KEY, lastApplied);
  logger.info(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'StorageMigrations - run done', { version: lastApplied });
};

export default runMigrations;
