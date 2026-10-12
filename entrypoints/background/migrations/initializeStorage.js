// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import runMigrations from './index.js';

let pendingInitialization = null;

/**
* Checks whether any migration has ever run on this storage. Installs older than
* `local:migrationVersion` (before 1.8.2) are recognized by the persistent keys written by migration 0.
* @async
* @return {Promise<boolean>} True if the storage has a migration history.
*/
const hasMigrationHistory = async () => {
  const [persistentPrivateKey, persistentPublicKey, migrationVersion] = await Promise.all([
    storage.getItem('local:persistentPrivateKey'),
    storage.getItem('local:persistentPublicKey'),
    storage.getItem('local:migrationVersion')
  ]);

  return Boolean(persistentPrivateKey || persistentPublicKey || (typeof migrationVersion === 'number' && migrationVersion >= 0));
};

/**
* Function to run the pending migrations. A storage found without any migration history is remembered in
* `migrations.freshStorage` for the life of this background instance.
* @async
* @param {Object} migrations - The state object to track migrations.
* @return {Promise<{ freshStorage: boolean }>} Whether this background instance found the storage without a migration history.
*/
const runInitialization = async migrations => {
  migrations.state = 'running';

  // Read before runMigrations(): migration 0 writes the markers, so a later read would hide a fresh storage.
  try {
    if (!(await hasMigrationHistory())) {
      migrations.freshStorage = true;
    }
  } catch (e) {
    await CatchError(e);
  }

  try {
    await runMigrations();
  } catch (e) {
    await CatchError(e);
  } finally {
    migrations.state = true;
  }

  return { freshStorage: migrations.freshStorage === true };
};

/**
* Function to clear the storage and initialize it from scratch (extension reset).
* @async
* @param {Object} migrations - The state object to track migrations.
* @return {Promise<{ freshStorage: boolean }>} Whether this background instance found the storage without a migration history.
*/
const runReset = async migrations => {
  migrations.state = 'running';

  try {
    await browser.storage.local.clear();
    await browser.storage.session.clear();
    logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - resetStorage (clear)');
  } catch (e) {
    migrations.state = true;
    throw e;
  }

  return runInitialization(migrations);
};

/**
* Function to make a run the one that later callers join, until it settles.
* @param {Promise<{ freshStorage: boolean }>} run - The initialization or reset run.
* @return {Promise<{ freshStorage: boolean }>} The tracked run.
*/
const trackRun = run => {
  const tracked = run.finally(() => {
    if (pendingInitialization === tracked) {
      pendingInitialization = null;
    }
  });

  pendingInitialization = tracked;

  return tracked;
};

/**
* Function to bring the storage of this profile up to date. Safari runs a separate extension instance with
* its own storage for every profile and may not fire `runtime.onInstalled` there, so this runs on every
* background start, not only from `runtime.onInstalled`. It never shows the onboarding: a new Safari profile
* must not get one. `freshStorage` lets onInstalled tell a real first install, also when the start-up run
* has already finished. Concurrent calls share one run.
* @param {Object} migrations - The state object to track migrations.
* @return {Promise<{ freshStorage: boolean }>} Whether this background instance found the storage without a migration history.
*/
const initializeStorage = migrations => {
  if (pendingInitialization) {
    return pendingInitialization;
  }

  return trackRun(runInitialization(migrations));
};

/**
* Function to reset the extension storage: waits for a running initialization, clears the storage and runs the
* migrations. Callers arriving meanwhile join the reset.
* @param {Object} migrations - The state object to track migrations.
* @return {Promise<{ freshStorage: boolean }>} Whether this background instance found the storage without a migration history.
*/
export const resetStorage = migrations => {
  const previousRun = pendingInitialization ? pendingInitialization.catch(() => {}) : Promise.resolve();

  return trackRun(previousRun.then(() => runReset(migrations)));
};

/**
* Function to wait until a running initialization or reset has finished. Resolves even if it failed.
* @return {Promise<void>} A promise that resolves when no initialization is running.
*/
export const whenStorageInitialized = async () => {
  if (pendingInitialization) {
    await pendingInitialization.catch(() => {});
  }
};

export default initializeStorage;
