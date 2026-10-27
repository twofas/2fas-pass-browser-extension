// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Fetches the local (transport-obfuscation) key from the background and imports it
* into the shared localKey holder, once, if it is not already present.
*
* The encrypted save-prompt mode (and the always-encrypted unload beacon) can only
* capture credentials when this key is available: handleInputEvent, encryptFlushData
* and checkInitialInputsValues all DROP captured data when it is missing, whereas the
* unencrypted mode captures unconditionally. Those paths fetch the key lazily on the
* first keystroke, which can land on a recycled MV3 service worker and fail, making the
* encrypted mode fail more often than the unencrypted one. Pre-fetching here at content
* -script init — right after the worker injected this script, so it is reliably alive —
* caches the key for the page lifetime (the content script outlives worker restarts),
* so later capture/flush/beacon never have to drop for want of a key. Best-effort: a
* failure leaves localKey.data null and the existing lazy fetch retries on keystroke.
* @async
* @param {Object} localKey - Shared key holder ({ data: CryptoKey|null, keyId: string|null }) mutated in place.
* @return {Promise<void>}
*/
const ensureLocalKey = async localKey => {
  if (localKey?.data || !crypto?.subtle) {
    return;
  }

  let response = null;

  try {
    response = await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.GET_LOCAL_KEY,
      target: REQUEST_TARGETS.BACKGROUND
    });
  } catch {}

  if (response?.status === 'ok' && response?.data && response.data.length > 0) {
    try {
      localKey.data = await crypto.subtle.importKey('raw', Base64ToArrayBuffer(response.data), { name: 'AES-GCM' }, false, ['encrypt']);
      localKey.keyId = response.keyId || null;
    } catch {}
  }
};

/**
* Refreshes in progress, per key holder.
* @type {WeakMap<Object, Promise<void>>}
*/
const pendingRefreshes = new WeakMap();

/**
* Replaces the cached local key with the current one. The background rotates the key on every lock and refuses values
* encrypted with an old key (staleKey), so the page fetches the key again before resending them. The old key stays in
* place until the new one is imported (a capture running meanwhile still has a key), and concurrent refreshes share one
* fetch.
* @param {Object} localKey - Shared key holder ({ data: CryptoKey|null, keyId: string|null }) mutated in place.
* @return {Promise<void>}
*/
export const refreshLocalKey = localKey => {
  const pending = pendingRefreshes.get(localKey);

  if (pending) {
    return pending;
  }

  const refresh = (async () => {
    const nextKey = { data: null, keyId: null };

    await ensureLocalKey(nextKey);

    if (nextKey.data) {
      localKey.data = nextKey.data;
      localKey.keyId = nextKey.keyId;
    }
  })().finally(() => {
    pendingRefreshes.delete(localKey);
  });

  pendingRefreshes.set(localKey, refresh);

  return refresh;
};

/**
* Waits for a refresh of the key holder that is in progress, so a value is not encrypted with the key about to be
* replaced.
* @param {Object} localKey - Shared key holder ({ data: CryptoKey|null, keyId: string|null }).
* @return {Promise<void>}
*/
export const waitForLocalKeyRefresh = localKey => pendingRefreshes.get(localKey) || Promise.resolve();

export default ensureLocalKey;
