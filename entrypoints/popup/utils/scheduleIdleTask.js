// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const IDLE_TASK_TIMEOUT = 1000;
const IDLE_TASK_FALLBACK_DELAY = 100;

/**
* Runs a task once the browser is idle (at the latest after a second), or after a short delay where
* requestIdleCallback is unavailable (Safari).
* @param {Function} task - The task to run.
* @return {Function} Cancels the task if it has not run yet.
*/
const scheduleIdleTask = task => {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(task, { timeout: IDLE_TASK_TIMEOUT });

    return () => window.cancelIdleCallback(handle);
  }

  const handle = setTimeout(task, IDLE_TASK_FALLBACK_DELAY);

  return () => clearTimeout(handle);
};

export default scheduleIdleTask;
