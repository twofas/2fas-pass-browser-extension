// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

const openInstallPage = vi.fn(async () => {});
vi.mock('../utils', () => ({
  openInstallPage: (...args) => openInstallPage(...args),
  setBadgeLocked: vi.fn(async () => {})
}));

const runMigrations = vi.fn(async () => {});
vi.mock('../migrations', () => ({ default: (...args) => runMigrations(...args) }));

const onWsMessage = vi.fn(() => true);
vi.mock('./onWsMessage', () => ({ default: (...args) => onWsMessage(...args) }));
vi.mock('./onPromptMessage', () => ({ default: vi.fn(() => false) }));
vi.mock('../devE2E', () => ({ default: vi.fn(() => false) }));
vi.mock('@/partials/functions', () => ({ isText: vi.fn(), checkStorageAutoClearActions: vi.fn() }));
vi.mock('../tabs/onTabFocused', () => ({ default: vi.fn() }));
vi.mock('../tabs/shouldHandleTabFocus', () => ({ default: vi.fn() }));
vi.mock('./handleCheckShareLinkSupport', () => ({ default: vi.fn() }));

import createMessageRouter from './createMessageRouter.js';
import initializeStorage from '../migrations/initializeStorage.js';

const sender = { id: browser.runtime.id };

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
* Creates a router with the state objects the background passes to it.
* @param {Object} migrations - The state object to track migrations.
* @return {Function} The runtime.onMessage listener.
*/
const createRouter = migrations => createMessageRouter({ migrations, tabsInputData: {}, savePromptActions: [], tabUpdateData: {} });

beforeEach(async () => {
  vi.clearAllMocks();
  await browser.storage.local.clear();
  await browser.storage.session.clear();
  browser.runtime.setUninstallURL = vi.fn();
  runMigrations.mockImplementation(writeMigrationMarkers);
});

describe('createMessageRouter — WebSocket requests on a cold start of a new profile', () => {
  it('waits for the storage initialization, so Connect finds the persistent keys', async () => {
    let release = null;
    const released = new Promise(resolve => {
      release = resolve;
    });
    runMigrations.mockImplementationOnce(async () => {
      await released;
      await writeMigrationMarkers();
    });

    const migrations = { state: false };
    const initialization = initializeStorage(migrations);
    let keyWhenHandled = 'not handled';
    onWsMessage.mockImplementationOnce(() => {
      storage.getItem('local:persistentPublicKey').then(value => {
        keyWhenHandled = value;
      });

      return true;
    });

    const keepsChannelOpen = createRouter(migrations)({ action: REQUEST_ACTIONS.WS_CONNECT_QR, target: REQUEST_TARGETS.BACKGROUND_WS }, sender, vi.fn());

    expect(keepsChannelOpen).toBe(true);

    await vi.waitFor(() => {
      expect(runMigrations).toHaveBeenCalledTimes(1);
    });
    expect(onWsMessage).not.toHaveBeenCalled();

    release();
    await initialization;

    await vi.waitFor(() => {
      expect(keyWhenHandled).toBe('PUB');
    });
  });

  it('passes the request to the WebSocket handler at once when nothing is running', async () => {
    const sendResponse = vi.fn();
    const request = { action: REQUEST_ACTIONS.WS_GET_STATE, target: REQUEST_TARGETS.BACKGROUND_WS };

    createRouter({ state: true })(request, sender, sendResponse);

    await vi.waitFor(() => {
      expect(onWsMessage).toHaveBeenCalledWith(request, sender, sendResponse);
    });
  });
});

describe('createMessageRouter — extension reset', () => {
  it('clears the storage, runs the migrations once and opens the onboarding page once', async () => {
    await writeMigrationMarkers();
    await storage.setItem('local:theme', 'dark');

    const sendResponse = vi.fn();
    const keepsChannelOpen = createRouter({ state: true })({ action: REQUEST_ACTIONS.RESET_EXTENSION, target: REQUEST_TARGETS.BACKGROUND }, sender, sendResponse);

    expect(keepsChannelOpen).toBe(true);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ status: 'ok' });
    });
    expect(await storage.getItem('local:theme')).toBeNull();
    expect(runMigrations).toHaveBeenCalledTimes(1);
    expect(openInstallPage).toHaveBeenCalledTimes(1);
  });

  it('waits for an initialization started by the same wake-up, so the migration runs never overlap', async () => {
    await writeMigrationMarkers();

    let runningNow = 0;
    let maxRunning = 0;
    runMigrations.mockImplementation(async () => {
      runningNow += 1;
      maxRunning = Math.max(maxRunning, runningNow);
      await writeMigrationMarkers();
      runningNow -= 1;
    });

    const migrations = { state: false };
    const sendResponse = vi.fn();
    initializeStorage(migrations);
    createRouter(migrations)({ action: REQUEST_ACTIONS.RESET_EXTENSION, target: REQUEST_TARGETS.BACKGROUND }, sender, sendResponse);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ status: 'ok' });
    });
    expect(runMigrations).toHaveBeenCalledTimes(2);
    expect(maxRunning).toBe(1);
    expect(openInstallPage).toHaveBeenCalledTimes(1);
  });
});
