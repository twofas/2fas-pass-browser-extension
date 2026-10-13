// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

const runMigrations = vi.fn(async () => {});
vi.mock('./index.js', () => ({ default: (...args) => runMigrations(...args) }));

import initializeStorage, { resetStorage, whenStorageInitialized } from './initializeStorage.js';

/**
* Mimics migration 0 on an empty storage: it generates the persistent keys and records the applied version.
* @async
* @return {Promise<void>}
*/
const writeMigrationMarkers = async () => {
  await storage.setItem('local:persistentPrivateKey', 'PRIV');
  await storage.setItem('local:persistentPublicKey', 'PUB');
  await storage.setItem('local:migrationVersion', 3);
};

/**
* Makes the next runMigrations() call wait until the returned function is called.
* @return {Function} Resolves the pending run after writing the migration markers.
*/
const holdNextMigrationRun = () => {
  let release = null;
  const released = new Promise(resolve => {
    release = resolve;
  });

  runMigrations.mockImplementationOnce(async () => {
    await released;
    await writeMigrationMarkers();
  });

  return release;
};

beforeEach(async () => {
  vi.clearAllMocks();
  await browser.storage.local.clear();
  await browser.storage.session.clear();
  browser.tabs.create = vi.fn(async () => ({}));
  runMigrations.mockImplementation(writeMigrationMarkers);
});

describe('initializeStorage — storage of a profile that never ran a migration (Safari new profile, no onInstalled)', () => {
  it('runs the migrations and reports the fresh storage', async () => {
    const result = await initializeStorage({ state: false });

    expect(result).toEqual({ freshStorage: true });
    expect(runMigrations).toHaveBeenCalledTimes(1);
  });

  it('opens no page: only onInstalled decides about the onboarding', async () => {
    await initializeStorage({ state: false });

    expect(browser.tabs.create).not.toHaveBeenCalled();
  });

  it('marks the migrations as running while they run and as done afterwards', async () => {
    const migrations = { state: false };
    let stateDuringRun = null;
    runMigrations.mockImplementationOnce(async () => {
      stateDuringRun = migrations.state;
      await writeMigrationMarkers();
    });

    await initializeStorage(migrations);

    expect(stateDuringRun).toBe('running');
    expect(migrations.state).toBe(true);
  });

  it('still finishes and reports the fresh storage when a migration fails', async () => {
    const migrations = { state: false };
    runMigrations.mockRejectedValueOnce(new Error('migration failed'));

    await expect(initializeStorage(migrations)).resolves.toEqual({ freshStorage: true });
    expect(migrations.state).toBe(true);
  });

  it('keeps reporting the fresh storage to later callers of the same background instance (onInstalled after the start-up run)', async () => {
    const migrations = { state: false };

    await initializeStorage(migrations);

    await expect(initializeStorage(migrations)).resolves.toEqual({ freshStorage: true });
    expect(runMigrations).toHaveBeenCalledTimes(2);
  });
});

describe('initializeStorage — storage with a migration history', () => {
  it('reports no fresh storage when a migration version is recorded', async () => {
    await storage.setItem('local:migrationVersion', 0);

    await expect(initializeStorage({ state: false })).resolves.toEqual({ freshStorage: false });
    expect(runMigrations).toHaveBeenCalledTimes(1);
  });

  it('reports no fresh storage for an install older than the migration version (persistent keys only)', async () => {
    await storage.setItem('local:persistentPrivateKey', 'PRIV');
    await storage.setItem('local:persistentPublicKey', 'PUB');

    await expect(initializeStorage({ state: false })).resolves.toEqual({ freshStorage: false });
  });

  it('reports no fresh storage when only one persistent key survived', async () => {
    await storage.setItem('local:persistentPublicKey', 'PUB');

    await expect(initializeStorage({ state: false })).resolves.toEqual({ freshStorage: false });
  });

  it('reports no fresh storage to a new background instance after the storage was initialized', async () => {
    await initializeStorage({ state: false });

    await expect(initializeStorage({ state: false })).resolves.toEqual({ freshStorage: false });
  });
});

describe('initializeStorage — concurrent callers (background start, onInstalled, onStartup)', () => {
  it('runs the migrations once and reports the fresh storage to every caller', async () => {
    const release = holdNextMigrationRun();
    const migrations = { state: false };
    const first = initializeStorage(migrations);
    const second = initializeStorage(migrations);

    release();

    await expect(Promise.all([first, second])).resolves.toEqual([{ freshStorage: true }, { freshStorage: true }]);
    expect(runMigrations).toHaveBeenCalledTimes(1);
  });
});

describe('whenStorageInitialized — work that needs the persistent keys waits for the running initialization', () => {
  it('resolves only after the running initialization has finished', async () => {
    const release = holdNextMigrationRun();
    const initialization = initializeStorage({ state: false });
    let ready = false;
    const waiting = whenStorageInitialized().then(() => {
      ready = true;
    });

    await vi.waitFor(() => {
      expect(runMigrations).toHaveBeenCalledTimes(1);
    });
    expect(ready).toBe(false);

    release();
    await waiting;

    expect(ready).toBe(true);
    expect(await storage.getItem('local:persistentPublicKey')).toBe('PUB');
    await initialization;
  });

  it('resolves immediately when nothing is running', async () => {
    await expect(whenStorageInitialized()).resolves.toBeUndefined();
  });
});

describe('resetStorage — the extension reset goes through the same lock', () => {
  it('clears the storage and runs the migrations again', async () => {
    await writeMigrationMarkers();
    await storage.setItem('local:theme', 'dark');
    await storage.setItem('session:anything', 'value');

    const migrations = { state: true };
    const result = await resetStorage(migrations);

    expect(result).toEqual({ freshStorage: true });
    expect(await storage.getItem('local:theme')).toBeNull();
    expect(await storage.getItem('session:anything')).toBeNull();
    expect(runMigrations).toHaveBeenCalledTimes(1);
    expect(migrations.state).toBe(true);
  });

  it('waits for a running initialization, so two migration runs never overlap', async () => {
    await writeMigrationMarkers();

    let runningNow = 0;
    let maxRunning = 0;
    let release = null;
    const released = new Promise(resolve => {
      release = resolve;
    });
    runMigrations.mockImplementation(async () => {
      runningNow += 1;
      maxRunning = Math.max(maxRunning, runningNow);
      await released;
      await writeMigrationMarkers();
      runningNow -= 1;
    });

    const migrations = { state: false };
    const initialization = initializeStorage(migrations);
    const reset = resetStorage(migrations);

    await vi.waitFor(() => {
      expect(runMigrations).toHaveBeenCalledTimes(1);
    });
    release();

    await expect(initialization).resolves.toEqual({ freshStorage: false });
    await expect(reset).resolves.toEqual({ freshStorage: true });
    expect(runMigrations).toHaveBeenCalledTimes(2);
    expect(maxRunning).toBe(1);
    expect(await storage.getItem('local:persistentPublicKey')).toBe('PUB');
  });

  it('makes later callers wait for the reset', async () => {
    const release = holdNextMigrationRun();
    const reset = resetStorage({ state: true });
    const joined = initializeStorage({ state: true });

    release();

    await expect(Promise.all([reset, joined])).resolves.toEqual([{ freshStorage: true }, { freshStorage: true }]);
    expect(runMigrations).toHaveBeenCalledTimes(1);
  });

  it('rejects and leaves the migrations unblocked when the storage cannot be cleared', async () => {
    const clear = vi.spyOn(browser.storage.local, 'clear').mockRejectedValueOnce(new Error('clear failed'));
    const migrations = { state: true };

    await expect(resetStorage(migrations)).rejects.toThrow('clear failed');
    expect(migrations.state).toBe(true);
    expect(runMigrations).not.toHaveBeenCalled();

    clear.mockRestore();
  });
});
