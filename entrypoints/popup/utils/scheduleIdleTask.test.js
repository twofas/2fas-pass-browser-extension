// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from 'vitest';
import scheduleIdleTask from './scheduleIdleTask';

describe('scheduleIdleTask', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete window.requestIdleCallback;
    delete window.cancelIdleCallback;
  });

  it('runs the task in an idle period with a deadline, and cancels it', () => {
    window.requestIdleCallback = vi.fn(() => 7);
    window.cancelIdleCallback = vi.fn();
    const task = vi.fn();

    const cancel = scheduleIdleTask(task);

    expect(window.requestIdleCallback).toHaveBeenCalledWith(task, { timeout: expect.any(Number) });
    cancel();
    expect(window.cancelIdleCallback).toHaveBeenCalledWith(7);
  });

  it('falls back to a short timeout where requestIdleCallback is missing (Safari)', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const task = vi.fn();

    scheduleIdleTask(task);
    vi.runAllTimers();

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('does not run a cancelled fallback task', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const task = vi.fn();

    scheduleIdleTask(task)();
    vi.runAllTimers();

    expect(task).not.toHaveBeenCalled();
  });
});
