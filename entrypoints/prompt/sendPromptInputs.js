// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import encryptFlushData from './encryptFlushData';
import { refreshLocalKey, waitForLocalKeyRefresh } from './ensureLocalKey';

/**
* Sends input payloads to the background as PROMPT_INPUT messages.
* @async
* @param {Object[]} data - The payloads.
* @return {Promise<Array>} The responses (null for a failed message).
*/
const sendEach = data => Promise.all(data.map(inputData => browser.runtime.sendMessage({
  action: REQUEST_ACTIONS.PROMPT_INPUT,
  data: inputData,
  target: REQUEST_TARGETS.BACKGROUND_PROMPT
}).catch(() => null)));

/**
* Sends flushed input values to the background, encrypting them in encrypted mode. When the background refuses a value
* encrypted with a local key rotated out by a lock (staleKey), the current key is fetched and the values are encrypted
* and sent again, once.
* @async
* @param {Object[]} pendingData - Flush payloads from flushPendingInputs.
* @param {Object} localKey - Shared key holder ({ data: CryptoKey|null, keyId: string|null }).
* @param {boolean} encrypted - Whether the save prompt runs in encrypted mode.
* @return {Promise<void>}
*/
const sendPromptInputs = async (pendingData, localKey, encrypted) => {
  await waitForLocalKeyRefresh(localKey);

  const sendData = encrypted ? await encryptFlushData(pendingData, localKey, encrypted) : pendingData;
  const responses = await sendEach(sendData);

  if (!encrypted || !responses.some(response => response?.message === 'staleKey')) {
    return;
  }

  await refreshLocalKey(localKey);

  if (!localKey?.data) {
    return;
  }

  await sendEach(await encryptFlushData(pendingData, localKey, encrypted));
};

export default sendPromptInputs;
