// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const loggerInfo = vi.fn();
const loggerWarn = vi.fn();
vi.mock('@/utils/logger', () => {
  const logger = { info: (...args) => loggerInfo(...args), debug: vi.fn(), warn: (...args) => loggerWarn(...args), error: vi.fn() };
  return { logger, default: logger };
});

const setThemeMock = vi.fn();
vi.mock('./setTheme.js', () => ({ default: (...args) => setThemeMock(...args) }));

const initI18nMock = vi.fn();
const getMessageMock = vi.fn(key => `msg:${key}`);
vi.mock('@/utils/getMessage', () => ({
  initI18n: (...args) => initI18nMock(...args),
  getMessage: (...args) => getMessageMock(...args),
  resetI18nCache: vi.fn(),
  getI18nState: vi.fn()
}));

const rehydrateMock = vi.fn();
const storeState = { href: [] };
vi.mock('../store/popupState/index.js', () => ({
  default: {
    persist: { rehydrate: (...args) => rehydrateMock(...args) },
    getState: () => storeState
  }
}));

import bootstrapPopup, { WS_STATE_TIMEOUT_MS, INIT_TIMEOUT_MS } from './bootstrapPopup.js';

const never = () => new Promise(() => {});

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  window.location.hash = '';
  window.__wsInitialState = undefined;
  window.__wsPendingUpdates = undefined;
  storeState.href = [];
  browser.runtime.sendMessage = vi.fn(async () => ({ state: { active: false } }));
  setThemeMock.mockResolvedValue();
  initI18nMock.mockResolvedValue();
  rehydrateMock.mockResolvedValue();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('bootstrapPopup', () => {
  it('logs the bootstrap start before waiting for anything', async () => {
    browser.runtime.sendMessage = vi.fn(never);
    bootstrapPopup();

    expect(loggerInfo).toHaveBeenCalledWith(LOGGER_CONSTANTS.CATEGORIES.SYSTEM, 'Popup - bootstrap start', expect.any(Object));
  });

  it('routes to an active connect action reported by the background', async () => {
    browser.runtime.sendMessage = vi.fn(async () => ({ state: { active: true, type: 'connect_qr' } }));

    await bootstrapPopup();

    expect(window.location.hash).toBe('#/connect');
    expect(window.__wsInitialState).toEqual({ active: true, type: 'connect_qr' });
    expect(window.__wsPendingUpdates?.toasts ?? []).toHaveLength(0);
  });

  it('restores the last visited route when no WS action is active', async () => {
    storeState.href = ['/settings'];

    await bootstrapPopup();

    expect(window.location.hash).toBe('#/settings');
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('finishes when the background never answers the WS state request', async () => {
    browser.runtime.sendMessage = vi.fn(never);
    const onDone = vi.fn();
    bootstrapPopup().then(onDone);

    await vi.advanceTimersByTimeAsync(WS_STATE_TIMEOUT_MS);

    expect(onDone).toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledWith(LOGGER_CONSTANTS.CATEGORIES.SYSTEM, 'Popup - background did not answer WS state request', expect.any(Object));
  });

  it('queues a persistent toast asking to restart the browser when the background never answers', async () => {
    browser.runtime.sendMessage = vi.fn(never);
    const done = bootstrapPopup();

    await vi.advanceTimersByTimeAsync(WS_STATE_TIMEOUT_MS);
    await done;

    expect(window.__wsPendingUpdates.toasts).toEqual([
      expect.objectContaining({ message: 'msg:popup_background_not_responding', type: 'error', autoClose: false })
    ]);
  });

  it('ignores a WS state answer that arrives after the timeout', async () => {
    let answer;
    browser.runtime.sendMessage = vi.fn(() => new Promise(resolve => { answer = resolve; }));
    const done = bootstrapPopup();

    await vi.advanceTimersByTimeAsync(WS_STATE_TIMEOUT_MS);
    await done;
    answer({ state: { active: true, type: 'fetch' } });
    await vi.advanceTimersByTimeAsync(0);

    expect(window.location.hash).not.toBe('#/fetch');
    expect(window.__wsInitialState).toBeUndefined();
  });

  it('finishes when storage-backed initialization never settles', async () => {
    setThemeMock.mockImplementation(never);
    initI18nMock.mockImplementation(never);
    rehydrateMock.mockImplementation(never);
    const onDone = vi.fn();
    bootstrapPopup().then(onDone);

    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS);

    expect(onDone).toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledWith(LOGGER_CONSTANTS.CATEGORIES.SYSTEM, 'Popup - initialization timed out', expect.any(Object));
    expect(window.__wsPendingUpdates.toasts).toHaveLength(1);
  });

  it('does not change the route when hydration finishes after the timeout', async () => {
    let finishHydration;
    rehydrateMock.mockImplementation(() => new Promise(resolve => { finishHydration = resolve; }));
    storeState.href = ['/settings'];
    const done = bootstrapPopup();

    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS);
    await done;
    finishHydration();
    await vi.advanceTimersByTimeAsync(0);

    expect(window.location.hash).toBe('');
  });

  it('queues only one toast when both stages time out', async () => {
    browser.runtime.sendMessage = vi.fn(never);
    setThemeMock.mockImplementation(never);
    const done = bootstrapPopup();

    await vi.advanceTimersByTimeAsync(WS_STATE_TIMEOUT_MS + INIT_TIMEOUT_MS);
    await done;

    expect(window.__wsPendingUpdates.toasts).toHaveLength(1);
  });
});
