// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Races a promise against a timeout. The timeout resolves instead of rejecting, so the caller can carry on with a fallback.
* A rejection of the promise that happens before the timeout is propagated.
* @param {Promise} promise - The promise to wait for.
* @param {number} ms - The timeout in milliseconds.
* @return {Promise<{timedOut: boolean, value: *}>} The settled value, or `timedOut: true` when the timeout won.
*/
const withTimeout = (promise, ms) => {
  let timeoutId;

  const timeout = new Promise(resolve => {
    timeoutId = setTimeout(() => {
      resolve({ timedOut: true, value: undefined });
    }, ms);
  });

  const settled = Promise.resolve(promise).then(value => ({ timedOut: false, value }));

  return Promise.race([settled, timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
};

export default withTimeout;
