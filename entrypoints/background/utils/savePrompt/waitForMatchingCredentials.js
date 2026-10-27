// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Default total time to wait for captured values matching a request body.
* @type {number}
*/
const DEFAULT_MAX_WAIT = 600; // milliseconds

/**
* Default polling step while waiting for matching values.
* @type {number}
*/
const DEFAULT_STEP = 50; // milliseconds

/**
* Re-reads the captured credentials until they match the submitted request or the time runs out. After a failed
* attempt the store still holds the old password while the one typed again may be on its way (debounce, encryption),
* so the first read alone can miss a genuine submission.
* @async
* @param {Function} readMatchingValues - Async function returning the matching values, or null when they do not match.
* @param {Object} [options] - Optional timing overrides.
* @param {number} [options.maxWait=600] - Total time to wait in milliseconds.
* @param {number} [options.step=50] - Polling interval in milliseconds.
* @return {Promise<Object|null>} The matching values, or null on timeout.
*/
const waitForMatchingCredentials = async (readMatchingValues, options = {}) => {
  const maxWait = typeof options.maxWait === 'number' ? options.maxWait : DEFAULT_MAX_WAIT;
  const step = typeof options.step === 'number' ? options.step : DEFAULT_STEP;
  let values = await readMatchingValues();
  let waited = 0;

  while (!values && waited < maxWait) {
    await new Promise(resolve => setTimeout(resolve, step));
    waited += step;
    values = await readMatchingValues();
  }

  return values || null;
};

export default waitForMatchingCredentials;
