// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { shouldReportStyleMutation, STYLE_OBSERVER_REPORT_INTERVAL } from './setupStyleObserver.js';

describe('shouldReportStyleMutation', () => {
  it('reports the first detected mutation (no prior report)', () => {
    expect(shouldReportStyleMutation({ lastReportTime: 0, now: 5000 })).toBe(true);
  });

  it('suppresses a mutation that happens within the rate-limit window', () => {
    const now = 1000 + STYLE_OBSERVER_REPORT_INTERVAL - 1;

    expect(shouldReportStyleMutation({ lastReportTime: 1000, now })).toBe(false);
  });

  it('reports again once the rate-limit window has fully elapsed', () => {
    const now = 1000 + STYLE_OBSERVER_REPORT_INTERVAL;

    expect(shouldReportStyleMutation({ lastReportTime: 1000, now })).toBe(true);
  });

  it('respects a custom interval', () => {
    expect(shouldReportStyleMutation({ lastReportTime: 1000, now: 1500, interval: 1000 })).toBe(false);
    expect(shouldReportStyleMutation({ lastReportTime: 1000, now: 2000, interval: 1000 })).toBe(true);
  });
});
