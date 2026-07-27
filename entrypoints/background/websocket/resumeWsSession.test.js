// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach, vi } from 'vitest';

const saveWsSession = vi.fn();
const loadWsSession = vi.fn();
const clearWsSession = vi.fn();
const bumpWsSessionActivity = vi.fn();
const markWsSessionConversation = vi.fn();
const bgConnectOnMessage = vi.fn();
const bgConnectOnClose = vi.fn();
const bgFetchOnMessage = vi.fn();
const bgFetchOnClose = vi.fn();
const wsNotify = vi.fn();
const startKeepalive = vi.fn();
const stopKeepalive = vi.fn();
const startSelfTick = vi.fn();
const stopSelfTick = vi.fn();
const getCurrentDevice = vi.fn();
const sendPush = vi.fn();
const getNTPTime = vi.fn();
const networkTest = vi.fn();
const deletePush = vi.fn();
const socketInstances = [];
let socketConstructorShouldThrow = false;

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('.', () => ({
  default: class MockTwoFasWebSocket {
    constructor (sessionId) {
      if (socketConstructorShouldThrow) {
        throw new Error('No WebSocket in test env');
      }

      this.sessionId = sessionId;
      this.open = vi.fn();
      this.close = vi.fn();
      this.addEventListener = vi.fn();
      this.waitForOpen = vi.fn(async () => {});
      socketInstances.push(this);
    }

    static getInstance () {
      throw new Error('No instance');
    }
  }
}));
vi.mock('./wsNotify.js', () => ({ default: (...a) => wsNotify(...a) }));
vi.mock('./wsSessionPersistence.js', () => ({
  saveWsSession: (...a) => saveWsSession(...a),
  loadWsSession: (...a) => loadWsSession(...a),
  clearWsSession: (...a) => clearWsSession(...a),
  bumpWsSessionActivity: (...a) => bumpWsSessionActivity(...a),
  markWsSessionConversation: (...a) => markWsSessionConversation(...a)
}));
vi.mock('./handlers/bgConnectOnMessage.js', () => ({ default: (...a) => bgConnectOnMessage(...a) }));
vi.mock('./handlers/bgConnectOnClose.js', () => ({ default: (...a) => bgConnectOnClose(...a) }));
vi.mock('./handlers/bgFetchOnMessage.js', () => ({ default: (...a) => bgFetchOnMessage(...a) }));
vi.mock('./handlers/bgFetchOnClose.js', () => ({ default: (...a) => bgFetchOnClose(...a) }));
vi.mock('./connect/keepalive.js', () => ({
  KEEPALIVE_ALARM: 'wsConnectKeepalive',
  startKeepalive: (...a) => startKeepalive(...a),
  stopKeepalive: (...a) => stopKeepalive(...a)
}));
vi.mock('./selfTick.js', () => ({
  startSelfTick: (...a) => startSelfTick(...a),
  stopSelfTick: (...a) => stopSelfTick(...a)
}));
vi.mock('@/partials/functions', () => ({
  getCurrentDevice: (...a) => getCurrentDevice(...a),
  sendPush: (...a) => sendPush(...a),
  getNTPTime: (...a) => getNTPTime(...a),
  networkTest: (...a) => networkTest(...a),
  deletePush: (...a) => deletePush(...a)
}));

import { resumeWsSession } from './wsManager.js';
import { wsState, resetState } from './wsState.js';

const pushDescriptor = overrides => ({
  version: 2,
  type: 'connect_push',
  phase: 'awaiting_mobile',
  sessionID: 'a1b2c3d4',
  deviceId: 'DEV-1',
  deviceName: 'Pixel 8',
  socketData: { uuid: 'U-1', path: 'connect_push', action: 'fullSync' },
  ephemeralData: { publicKey: 'PK', uuid: 'U-1' },
  lastActivityAt: Date.now(),
  savedAt: Date.now(),
  ...overrides
});

const fetchDescriptor = overrides => pushDescriptor({
  type: 'fetch',
  socketData: { uuid: 'U-OLD', path: null, action: null },
  ephemeralData: null,
  fetchAction: 'passwordRequest',
  fetchLocationState: { action: 'passwordRequest', data: { deviceId: 'DEV-1' } },
  ...overrides
});

describe('resumeWsSession', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetState();
    socketInstances.length = 0;
    socketConstructorShouldThrow = false;
    saveWsSession.mockResolvedValue(true);
    bumpWsSessionActivity.mockResolvedValue(true);
    markWsSessionConversation.mockResolvedValue(true);
    clearWsSession.mockResolvedValue(undefined);
    stopKeepalive.mockResolvedValue(undefined);
    startKeepalive.mockResolvedValue(undefined);
    await storage.removeItem('local:devices');
  });

  it('no-ops when a session is already active', async () => {
    wsState.active = true;
    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'active' });
    expect(loadWsSession).not.toHaveBeenCalled();
  });

  it('returns active without dispatching or clearing when a session activates during loadWsSession', async () => {
    loadWsSession.mockImplementation(async () => {
      wsState.active = true;
      return { descriptor: pushDescriptor(), expired: true };
    });

    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'active' });
    expect(bgConnectOnClose).not.toHaveBeenCalled();
    expect(bgFetchOnClose).not.toHaveBeenCalled();
    expect(clearWsSession).not.toHaveBeenCalled();
    expect(stopKeepalive).not.toHaveBeenCalled();
  });

  it('returns none when nothing is persisted', async () => {
    loadWsSession.mockResolvedValue(null);
    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'none' });
    expect(stopKeepalive).toHaveBeenCalled();
  });

  it('dispatches synthetic CONNECTION_TIMEOUT for an expired push session', async () => {
    loadWsSession.mockResolvedValue({ descriptor: pushDescriptor(), expired: true });

    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'timeout' });

    expect(bgConnectOnClose).toHaveBeenCalledWith(
      expect.objectContaining({ code: WEBSOCKET_STATES.CONNECTION_TIMEOUT }),
      expect.objectContaining({ uuid: 'U-1' })
    );
    expect(clearWsSession).toHaveBeenCalled();
    expect(stopKeepalive).toHaveBeenCalled();
    expect(stopSelfTick).toHaveBeenCalled();
  });

  it('passes the exact wsState._socketData object to the synthetic close handler', async () => {
    let socketDataAtCall = null;
    let sameIdentity = false;
    bgConnectOnClose.mockImplementation(async (event, data) => {
      socketDataAtCall = data;
      sameIdentity = wsState._socketData === data;
    });
    loadWsSession.mockResolvedValue({ descriptor: pushDescriptor(), expired: true });

    await resumeWsSession();

    expect(socketDataAtCall).toMatchObject({ uuid: 'U-1' });
    expect(sameIdentity).toBe(true);
  });

  it('dispatches synthetic MOBILE_DISCONNECTED for a dead mid-conversation session', async () => {
    loadWsSession.mockResolvedValue({ descriptor: pushDescriptor({ phase: 'active_conversation' }), expired: false });

    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'disconnected' });
    expect(bgConnectOnClose).toHaveBeenCalledWith(
      expect.objectContaining({ code: WEBSOCKET_STATES.MOBILE_DISCONNECTED }),
      expect.anything()
    );
    expect(clearWsSession).toHaveBeenCalled();
  });

  it('routes an expired fetch session to bgFetchOnClose', async () => {
    loadWsSession.mockResolvedValue({ descriptor: fetchDescriptor(), expired: true });

    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'timeout' });
    expect(bgFetchOnClose).toHaveBeenCalledWith(
      expect.objectContaining({ code: WEBSOCKET_STATES.CONNECTION_TIMEOUT }),
      expect.anything()
    );
    expect(bgConnectOnClose).not.toHaveBeenCalled();
  });

  it('returns idle for a QR session when the popup has not been recently active', async () => {
    loadWsSession.mockResolvedValue({ descriptor: pushDescriptor({ type: 'connect_qr' }), expired: false });

    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'idle' });
    expect(stopKeepalive).toHaveBeenCalled();
    expect(bgConnectOnClose).not.toHaveBeenCalled();
    expect(clearWsSession).not.toHaveBeenCalled();
  });

  it('does NOT re-send the push notification when resuming an awaiting_mobile push session', async () => {
    loadWsSession.mockResolvedValue({ descriptor: pushDescriptor(), expired: false });
    await storage.setItem('local:devices', [{ id: 'DEV-1', name: 'Pixel 8', sessionId: 'AAAA' }]);

    const result = await resumeWsSession();

    expect(sendPush).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'ok' });
  });

  it('rebuilds push session state keeping the descriptor uuid (ephemeral keypair identity)', async () => {
    loadWsSession.mockResolvedValue({ descriptor: pushDescriptor(), expired: false });
    await storage.setItem('local:devices', [{ id: 'DEV-1', name: 'Pixel 8', sessionId: 'AAAA' }]);

    const result = await resumeWsSession();

    expect(result).toMatchObject({ status: 'ok' });
    expect(wsState.active).toBe(true);
    expect(wsState.type).toBe('connect_push');
    expect(wsState.deviceName).toBe('Pixel 8');
    expect(wsState._ephemeralData).toMatchObject({ publicKey: 'PK', uuid: 'U-1' });
    expect(wsState._socketData).toMatchObject({ uuid: 'U-1', path: 'connect_push' });
    expect(socketInstances).toHaveLength(1);
    expect(socketInstances[0].sessionId).toBe('a1b2c3d4');
    expect(socketInstances[0].addEventListener).toHaveBeenCalledWith('message', expect.any(Function), wsState._socketData);
    expect(socketInstances[0].addEventListener).toHaveBeenCalledWith('close', expect.any(Function), wsState._socketData);
    expect(bumpWsSessionActivity).toHaveBeenCalled();
    expect(startKeepalive).toHaveBeenCalled();
    expect(startSelfTick).toHaveBeenCalled();
  });

  it('dispatches synthetic MOBILE_DISCONNECTED when the push device is gone', async () => {
    loadWsSession.mockResolvedValue({ descriptor: pushDescriptor(), expired: false });

    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'error' });
    expect(bgConnectOnClose).toHaveBeenCalledWith(
      expect.objectContaining({ code: WEBSOCKET_STATES.MOBILE_DISCONNECTED }),
      expect.anything()
    );
    expect(clearWsSession).toHaveBeenCalled();
  });

  it('reconnects the push session to the PERSISTED sessionID even when the device sessionId rotated', async () => {
    loadWsSession.mockResolvedValue({ descriptor: pushDescriptor(), expired: false });
    await storage.setItem('local:devices', [{ id: 'DEV-1', name: 'Pixel 8', sessionId: 'Uk9UQVRFRA==' }]);

    const result = await resumeWsSession();

    expect(result).toMatchObject({ status: 'ok' });
    expect(socketInstances).toHaveLength(1);
    expect(socketInstances[0].sessionId).toBe('a1b2c3d4');
  });

  it('dispatches synthetic MOBILE_DISCONNECTED when the push descriptor has no sessionID', async () => {
    loadWsSession.mockResolvedValue({ descriptor: pushDescriptor({ sessionID: null }), expired: false });
    await storage.setItem('local:devices', [{ id: 'DEV-1', name: 'Pixel 8', sessionId: 'AAAA' }]);

    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'error' });
    expect(bgConnectOnClose).toHaveBeenCalledWith(
      expect.objectContaining({ code: WEBSOCKET_STATES.MOBILE_DISCONNECTED }),
      expect.anything()
    );
    expect(socketInstances).toHaveLength(0);
    expect(clearWsSession).toHaveBeenCalled();
  });

  it('dispatches synthetic MOBILE_DISCONNECTED when the fetch descriptor has no sessionID', async () => {
    loadWsSession.mockResolvedValue({ descriptor: fetchDescriptor({ sessionID: null }), expired: false });
    getCurrentDevice.mockResolvedValue({ id: 'DEV-1', sessionId: 'AAAA', uuid: 'DEV-EPHE-UUID', updatedAt: Date.now() });

    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'error' });
    expect(bgFetchOnClose).toHaveBeenCalledWith(
      expect.objectContaining({ code: WEBSOCKET_STATES.MOBILE_DISCONNECTED }),
      expect.anything()
    );
    expect(socketInstances).toHaveLength(0);
    expect(clearWsSession).toHaveBeenCalled();
  });

  it('resumes a fetch session with a FRESH socket uuid and re-saves the descriptor', async () => {
    loadWsSession.mockResolvedValue({ descriptor: fetchDescriptor(), expired: false });
    getCurrentDevice.mockResolvedValue({ id: 'DEV-1', sessionId: 'AAAA', uuid: 'DEV-EPHE-UUID', updatedAt: Date.now() });

    const result = await resumeWsSession();

    expect(result).toMatchObject({ status: 'ok' });
    expect(wsState.active).toBe(true);
    expect(wsState.type).toBe('fetch');
    expect(wsState.fetchAction).toBe('passwordRequest');
    expect(wsState.fetchState).toBe(0);
    expect(typeof wsState._socketData.uuid).toBe('string');
    expect(wsState._socketData.uuid).not.toBe('U-OLD');
    expect(socketInstances).toHaveLength(1);
    expect(socketInstances[0].sessionId).toBe('a1b2c3d4');
    expect(saveWsSession).toHaveBeenCalledWith(expect.objectContaining({
      type: 'fetch',
      sessionID: 'a1b2c3d4',
      socketData: expect.objectContaining({ uuid: wsState._socketData.uuid })
    }));
    expect(sendPush).not.toHaveBeenCalled();
    expect(startKeepalive).toHaveBeenCalled();
    expect(startSelfTick).toHaveBeenCalled();
  });

  it('dispatches synthetic MOBILE_DISCONNECTED when the fetch device cannot be resolved', async () => {
    loadWsSession.mockResolvedValue({ descriptor: fetchDescriptor(), expired: false });
    getCurrentDevice.mockRejectedValue(new Error('no device'));

    await expect(resumeWsSession()).resolves.toMatchObject({ status: 'error' });
    expect(bgFetchOnClose).toHaveBeenCalledWith(
      expect.objectContaining({ code: WEBSOCKET_STATES.MOBILE_DISCONNECTED }),
      expect.anything()
    );
    expect(clearWsSession).toHaveBeenCalled();
  });

  it('dispatches synthetic MOBILE_DISCONNECTED when the resume socket cannot be created', async () => {
    vi.useFakeTimers();

    try {
      socketConstructorShouldThrow = true;
      loadWsSession.mockResolvedValue({ descriptor: pushDescriptor(), expired: false });
      await storage.setItem('local:devices', [{ id: 'DEV-1', name: 'Pixel 8', sessionId: 'AAAA' }]);

      const resultPromise = resumeWsSession();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toMatchObject({ status: 'error' });
      expect(bgConnectOnClose).toHaveBeenCalledWith(
        expect.objectContaining({ code: WEBSOCKET_STATES.MOBILE_DISCONNECTED }),
        expect.anything()
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
