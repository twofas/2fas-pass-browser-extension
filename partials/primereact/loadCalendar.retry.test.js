// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

const state = vi.hoisted(() => ({ fail: true }));

vi.mock('primereact/calendar', () => {
  if (state.fail) {
    throw new Error('chunk failed');
  }

  return { Calendar: 'MockCalendar' };
});
vi.mock('primereact/api', () => ({ addLocale: vi.fn(), locale: vi.fn() }));

import { getLoadedCalendar, loadCalendar } from './loadCalendar';

describe('loadCalendar after a failed load', () => {
  it('forgets the failure and loads on the next call', async () => {
    await expect(loadCalendar()).rejects.toThrow();
    expect(getLoadedCalendar()).toBeNull();

    state.fail = false;

    await expect(loadCalendar()).resolves.toBe('MockCalendar');
  });
});
