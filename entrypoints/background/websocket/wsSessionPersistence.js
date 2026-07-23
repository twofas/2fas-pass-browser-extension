// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import encryptValueForTransmission from '@/partials/functions/encryptValueForTransmission';
import decryptValueFromTransmission from '@/partials/functions/decryptValueFromTransmission';

const WS_SESSION_KEY = 'session:wsSessionResume';
const RESUME_VERSION = 2;
const SESSION_TYPES = ['connect_qr', 'connect_push', 'fetch'];
const SESSION_PHASES = ['awaiting_mobile', 'active_conversation'];

const getResumeTtlMs = () => 1000 * 60 * config.webSocketInternalTimeout;

// Bumped by clearWsSession so any in-flight updateWsSession (fired unawaited per
// inbound frame) aborts instead of resurrecting a descriptor for a finished session.
let sessionEpoch = 0;

const writeDescriptor = async (descriptor, epoch = null) => {
  const encrypted = await encryptValueForTransmission(JSON.stringify(descriptor));

  if (encrypted?.status !== 'ok' || !encrypted.data) {
    return false;
  }

  if (epoch !== null && sessionEpoch !== epoch) {
    return false;
  }

  await storage.setItem(WS_SESSION_KEY, encrypted.data);
  return true;
};

const saveWsSession = async data => {
  if (!data?.type || !SESSION_TYPES.includes(data.type) || !data?.sessionID) {
    return false;
  }

  try {
    return await writeDescriptor({
      version: RESUME_VERSION,
      type: data.type,
      phase: SESSION_PHASES.includes(data.phase) ? data.phase : 'awaiting_mobile',
      sessionID: data.sessionID,
      qrData: data.qrData || null,
      ephemeralData: data.ephemeralData ? { publicKey: data.ephemeralData.publicKey, uuid: data.ephemeralData.uuid } : null,
      socketData: data.socketData ? { uuid: data.socketData.uuid, path: data.socketData.path || null, action: data.socketData.action || null } : null,
      connectView: data.connectView || null,
      deviceName: data.deviceName || null,
      deviceId: data.deviceId || null,
      fetchAction: data.fetchAction || null,
      fetchLocationState: data.fetchLocationState || null,
      lastActivityAt: Date.now(),
      savedAt: typeof data.savedAt === 'number' ? data.savedAt : Date.now()
    });
  } catch {
    return false;
  }
};

const loadWsSession = async () => {
  let stored = null;
  let result = null;

  try {
    stored = await storage.getItem(WS_SESSION_KEY);

    if (!stored) {
      return null;
    }

    result = await decryptValueFromTransmission(stored);

    if (result?.status !== 'ok' || !result.data) {
      await clearWsSession();
      return null;
    }

    const descriptor = JSON.parse(result.data);

    if (descriptor?.version !== RESUME_VERSION || !SESSION_TYPES.includes(descriptor?.type) || !SESSION_PHASES.includes(descriptor?.phase) || !descriptor?.sessionID || typeof descriptor.lastActivityAt !== 'number' || typeof descriptor.savedAt !== 'number') {
      await clearWsSession();
      return null;
    }

    const ttl = getResumeTtlMs();
    const inactivityExpired = (Date.now() - descriptor.lastActivityAt) > ttl;
    const awaitingExpired = descriptor.phase === 'awaiting_mobile' && (Date.now() - descriptor.savedAt) > ttl;

    return {
      descriptor,
      expired: inactivityExpired || awaitingExpired
    };
  } catch {
    await clearWsSession();
    return null;
  } finally {
    stored = null;
    result = null;
  }
};

const updateWsSession = async updater => {
  const epoch = sessionEpoch;
  const loaded = await loadWsSession();

  if (!loaded?.descriptor || sessionEpoch !== epoch) {
    return false;
  }

  try {
    return await writeDescriptor(updater(loaded.descriptor), epoch);
  } catch {
    return false;
  }
};

const bumpWsSessionActivity = () => updateWsSession(descriptor => ({ ...descriptor, lastActivityAt: Date.now() }));

const markWsSessionConversation = () => updateWsSession(descriptor => ({ ...descriptor, phase: 'active_conversation', lastActivityAt: Date.now() }));

const clearWsSession = async () => {
  sessionEpoch += 1;

  try {
    await storage.removeItem(WS_SESSION_KEY);
  } catch {}
};

export { saveWsSession, loadWsSession, clearWsSession, bumpWsSessionActivity, markWsSessionConversation };
