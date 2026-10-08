// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

const { addLocale, locale } = vi.hoisted(() => ({ addLocale: vi.fn(), locale: vi.fn() }));

vi.mock('primereact/calendar', () => ({ Calendar: 'MockCalendar' }));
vi.mock('primereact/api', () => ({ addLocale, locale }));

import { getLoadedCalendar, loadCalendar, applyCalendarLocale } from './loadCalendar';

const getMessage = key => `t:${key}`;

describe('loadCalendar', () => {
  it('does not touch the PrimeReact locale before the calendar is loaded', () => {
    applyCalendarLocale(getMessage);

    expect(addLocale).not.toHaveBeenCalled();
    expect(getLoadedCalendar()).toBeNull();
  });

  it('loads the calendar once, then serves it synchronously', async () => {
    const first = loadCalendar();

    expect(loadCalendar()).toBe(first);
    await expect(first).resolves.toBe('MockCalendar');
    expect(getLoadedCalendar()).toBe('MockCalendar');
  });

  it('applies the extension texts as the active PrimeReact locale', () => {
    applyCalendarLocale(getMessage);

    expect(addLocale).toHaveBeenCalledWith('app', expect.objectContaining({
      monthNames: expect.arrayContaining(['t:primereact_month_january']),
      chooseMonth: 't:primereact_choose_month'
    }));
    expect(locale).toHaveBeenCalledWith('app');
  });
});
