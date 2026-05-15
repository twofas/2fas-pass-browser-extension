// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const migrationModules = import.meta.glob('./migrationsDatabase/*.js', { eager: true });

/** 
* Function to run migrations for the browser.
* @async
* @return {Promise<void>} A promise that resolves when the migrations are complete.
*/
const runMigrations = async () => {
  // Sort migration files by number
  const sortedMigrations = Object.entries(migrationModules)
    .sort(([a], [b]) => {
      const numA = parseInt(a.match(/(\d+)/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/(\d+)/)?.[1] || '0', 10);
      return numA - numB;
    });

  logger.info(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'StorageMigrations - run start', { count: sortedMigrations.length });

  for (const [path, migration] of sortedMigrations) {
    if (typeof migration.default === 'function') {
      const fileName = path.split('/').pop();

      try {
        await migration.default();
        logger.info(LOGGER_CONSTANTS.CATEGORIES.STORAGE, `StorageMigrations - ${fileName} completed`);
      } catch (e) {
        logger.error(LOGGER_CONSTANTS.CATEGORIES.STORAGE, `StorageMigrations - ${fileName} failed`, { errorName: e?.name });
        throw e;
      }
    }
  }

  logger.info(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'StorageMigrations - run done');
};

export default runMigrations;
