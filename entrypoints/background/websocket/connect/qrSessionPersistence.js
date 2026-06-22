// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import encryptValueForTransmission from '@/partials/functions/encryptValueForTransmission';
import decryptValueFromTransmission from '@/partials/functions/decryptValueFromTransmission';

const QR_RESUME_KEY = 'session:wsConnectQrResume';
const RESUME_VERSION = 1;

/**
* TTL for a persisted QR connect session, aligned with the socket's own internal
* timeout. A session older than this can no longer pair (the proxy rendezvous slot
* has expired), so we never try to resume it.
* @return {number} TTL in milliseconds.
*/
const getResumeTtlMs = () => 1000 * 60 * config.webSocketInternalTimeout;

/**
* Persists the in-flight QR connect session so it survives a Safari background
* service-worker termination. The blob is encrypted with the local key (lKey) and
* stored in `storage.session` — never plaintext. The ephemeral private key itself is
* already in session storage (keyed by uuid); here we persist the keypair reference
* (uuid/publicKey) plus view state so that, on wake, a FRESH sessionID + QR can be minted
* while reusing the same keypair. We do not reconnect to the old sessionID — the proxy
* drops the rendezvous when our socket dies, so it would pair to nothing.
* @async
* @param {Object} params - The QR session data.
* @param {string} params.sessionID - The proxy session ID the socket is bound to.
* @param {string} params.qrData - The rendered QR payload shown in the popup.
* @param {Object} [params.ephemeralData] - `{ publicKey, uuid }` of the ephemeral keypair.
* @param {Object} [params.socketData] - `{ uuid, path }` passed to the socket handlers.
* @param {string} [params.connectView] - The current connect view.
* @return {Promise<boolean>} True when the session was persisted.
*/
const saveQrSession = async ({ sessionID, qrData, ephemeralData, socketData, connectView }) => {
  if (!sessionID) {
    return false;
  }

  try {
    const payload = JSON.stringify({
      version: RESUME_VERSION,
      type: 'connect_qr',
      sessionID,
      qrData,
      ephemeralData: ephemeralData ? { publicKey: ephemeralData.publicKey, uuid: ephemeralData.uuid } : null,
      socketData: socketData ? { uuid: socketData.uuid, path: socketData.path } : null,
      connectView: connectView || null,
      savedAt: Date.now()
    });

    const encrypted = await encryptValueForTransmission(payload);

    if (encrypted?.status !== 'ok' || !encrypted.data) {
      return false;
    }

    await storage.setItem(QR_RESUME_KEY, encrypted.data);

    return true;
  } catch {
    return false;
  }
};

/**
* Loads and decrypts a persisted QR connect session, returning null (and clearing the
* blob) when it is missing, undecryptable, malformed, or expired.
* @async
* @return {Promise<Object|null>} The session object, or null.
*/
const loadQrSession = async () => {
  let stored = null;
  let result = null;

  try {
    stored = await storage.getItem(QR_RESUME_KEY);

    if (!stored) {
      return null;
    }

    result = await decryptValueFromTransmission(stored);

    if (result?.status !== 'ok' || !result.data) {
      await clearQrSession();
      return null;
    }

    const parsed = JSON.parse(result.data);

    if (parsed?.version !== RESUME_VERSION || parsed?.type !== 'connect_qr' || !parsed?.sessionID) {
      await clearQrSession();
      return null;
    }

    if (typeof parsed.savedAt !== 'number' || (Date.now() - parsed.savedAt) > getResumeTtlMs()) {
      await clearQrSession();
      return null;
    }

    return parsed;
  } catch {
    await clearQrSession();
    return null;
  } finally {
    stored = null;
    result = null;
  }
};

/**
* Removes the persisted QR connect session.
* @async
* @return {Promise<void>}
*/
const clearQrSession = async () => {
  try {
    await storage.removeItem(QR_RESUME_KEY);
  } catch {}
};

export { saveQrSession, loadQrSession, clearQrSession };
