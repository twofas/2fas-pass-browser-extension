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

  for (const [, migration] of sortedMigrations) {
    if (typeof migration.default === 'function') {
      await migration.default();
    }
  }
};

export default runMigrations;
