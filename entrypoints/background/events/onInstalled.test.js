// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

const initContextMenu = vi.fn(async () => {});
vi.mock('../contextMenu/initContextMenu', () => ({ default: (...args) => initContextMenu(...args) }));

const openInstallPage = vi.fn(async () => {});
const updateBadge = vi.fn(async () => {});
const setBadgeLocked = vi.fn(async () => {});
vi.mock('../utils', () => ({
  openInstallPage: (...args) => openInstallPage(...args),
  updateBadge: (...args) => updateBadge(...args),
  setBadgeLocked: (...args) => setBadgeLocked(...args)
}));

const runMigrations = vi.fn(async () => {});
vi.mock('../migrations', () => ({ default: (...args) => runMigrations(...args) }));

const setIdleInterval = vi.fn();
vi.mock('@/partials/functions/setIdleInterval', () => ({ default: (...args) => setIdleInterval(...args) }));

const getItems = vi.fn(async () => []);
vi.mock('@/partials/sessionStorage/getItems', () => ({ default: (...args) => getItems(...args) }));

const getConfiguredBoolean = vi.fn(async () => false);
vi.mock('@/partials/sessionStorage/configured/getConfiguredBoolean', () => ({ default: (...args) => getConfiguredBoolean(...args) }));

import onInstalled from './onInstalled.js';

const newMigrations = () => ({ state: false });

beforeEach(async () => {
  vi.clearAllMocks();
  await browser.storage.local.clear();
  await browser.storage.session.clear();
  // setUninstallURL is called on a genuine first install (non-safari); fakeBrowser may
  // not implement it, so stub it defensively.
  browser.runtime.setUninstallURL = vi.fn();
});

describe('onInstalled — onboarding page is shown ONLY on a genuine first install', () => {
  it('opens the install page on a true fresh install (storage empty, no prior init markers)', async () => {
    await onInstalled({ reason: 'install' }, newMigrations());

    expect(openInstallPage).toHaveBeenCalledTimes(1);
  });

  it('does NOT open the install page on reason="install" when the profile was already initialized (Safari TestFlight reinstall-on-update, persistent keys survive)', async () => {
    await storage.setItem('local:persistentPrivateKey', 'PRIV');
    await storage.setItem('local:persistentPublicKey', 'PUB');
    await storage.setItem('local:migrationVersion', 0);

    await onInstalled({ reason: 'install' }, newMigrations());

    expect(openInstallPage).not.toHaveBeenCalled();
  });

  it('does NOT open the install page on a normal update', async () => {
    await onInstalled({ reason: 'update', previousVersion: '1.8.3' }, newMigrations());

    expect(openInstallPage).not.toHaveBeenCalled();
  });

  it('treats an already-initialized reinstall like an update (runs the badge branch instead of onboarding)', async () => {
    await storage.setItem('local:persistentPrivateKey', 'PRIV');
    await storage.setItem('local:persistentPublicKey', 'PUB');
    await storage.setItem('local:migrationVersion', 0);
    getConfiguredBoolean.mockResolvedValueOnce(true);

    await onInstalled({ reason: 'install' }, newMigrations());

    expect(openInstallPage).not.toHaveBeenCalled();
    expect(getConfiguredBoolean).toHaveBeenCalled();
    expect(updateBadge).toHaveBeenCalledWith(true, expect.anything());
  });

  it('snapshots the init markers BEFORE running migrations (migrations generate the keys, so a fresh install must still show onboarding)', async () => {
    // Reproduce the real ordering: runMigrations() is what creates the persistent keys
    // and migrationVersion. If the init snapshot were read AFTER migrations, a true first
    // install would be misclassified as already-initialized and onboarding would be
    // permanently suppressed for every new user.
    runMigrations.mockImplementationOnce(async () => {
      await storage.setItem('local:persistentPrivateKey', 'PRIV');
      await storage.setItem('local:persistentPublicKey', 'PUB');
      await storage.setItem('local:migrationVersion', 0);
    });

    await onInstalled({ reason: 'install' }, newMigrations());

    expect(openInstallPage).toHaveBeenCalledTimes(1);
  });

  it('is resilient to a partial/corrupt key write: a present migrationVersion alone marks the profile initialized', async () => {
    // Only one of the two keys persisted (interrupted earlier write), but migrationVersion
    // is set — the profile has been initialized before, so no onboarding on reinstall.
    await storage.setItem('local:persistentPublicKey', 'PUB');
    await storage.setItem('local:migrationVersion', 0);

    await onInstalled({ reason: 'install' }, newMigrations());

    expect(openInstallPage).not.toHaveBeenCalled();
  });
});
