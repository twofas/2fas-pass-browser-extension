// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Regression coverage for the Highly Secret "fetched" countdown timer on the item list.
//
// The countdown is driven by a polling useEffect that reads the reset alarm
// (browser.alarms.get) and starts the interval animating the SVG loader. When an item
// becomes fetched (sifExists: false -> true) WHILE the popup stays open, the list refreshes
// in place (storage.watch -> getItems -> setItems) with a stable key, so the component
// re-renders WITHOUT remounting. If sifExists is not part of the effect's dependency array,
// the effect never re-runs, the alarm is never read, scheduledTime stays false, and the SVG
// keeps its default (empty / expired-looking) stroke-dashoffset until the popup is reopened.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { createElement } from 'react';

vi.mock('@/partials/context/I18nContext', () => ({
  useI18n: () => ({ getMessage: key => key })
}));

// ClearLink renders a react-router <Link>; it needs a Router context that is irrelevant here.
vi.mock('@/entrypoints/popup/components/ClearLink', () => ({
  default: ({ children }) => createElement('span', null, children)
}));

// `*.svg?react` is transformed to a React component by the WXT build, but not under vitest.
vi.mock('@/assets/popup-window/service-fetch.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/assets/popup-window/service-password.svg?react', () => ({ default: () => createElement('svg') }));

import CopyPasswordBtn from './CopyPasswordBtn';

const ALARM_NAME = 'sifT2Reset-dev-1|vault-1|item-1';

const makeItem = sifExists => ({
  id: 'item-1',
  deviceId: 'dev-1',
  vaultId: 'vault-1',
  securityType: SECURITY_TIER.HIGHLY_SECRET,
  sifExists,
  internalData: { sifResetTime: 3 }
});

describe('CopyPasswordBtn — Highly Secret fetched countdown timer', () => {
  beforeEach(async () => {
    await browser.alarms.clearAll();
  });

  it('reads the reset alarm when the item becomes fetched while mounted (sifExists false -> true)', async () => {
    const getSpy = vi.spyOn(browser.alarms, 'get');

    const { rerender } = render(
      createElement(CopyPasswordBtn, { item: makeItem(false), more: false, setMore: () => {} })
    );

    // Not fetched yet: getItemAlarm bails out before touching the alarms API.
    expect(getSpy).not.toHaveBeenCalled();

    // keepItem creates the reset alarm (possibly from the background) before the list refresh.
    await browser.alarms.create(ALARM_NAME, { delayInMinutes: 3 });
    getSpy.mockClear();

    // In-place list refresh: same instance, sifExists flips false -> true (no remount).
    await act(async () => {
      rerender(createElement(CopyPasswordBtn, { item: makeItem(true), more: false, setMore: () => {} }));
    });

    // The polling effect must re-run and read THIS item's alarm so the timer can start.
    expect(getSpy).toHaveBeenCalledWith(ALARM_NAME);
  });
});

describe('CopyPasswordBtn — SECRET item without stored password (issue #46)', () => {
  it('renders a disabled copy button with the active tooltip when sifExists is false', () => {
    const item = { ...makeItem(false), securityType: SECURITY_TIER.SECRET };

    const { container } = render(
      createElement(CopyPasswordBtn, { item, more: false, setMore: () => {} })
    );

    const wrapper = container.firstChild;
    const button = container.querySelector('button');

    expect(button).not.toBeNull();
    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('title')).toBe(false);
    expect(wrapper.getAttribute('data-tooltip')).toBe('this_tab_copy_disabled_no_password');
  });

  it('renders an enabled copy button when the SECRET item has a stored password', () => {
    const item = { ...makeItem(true), securityType: SECURITY_TIER.SECRET };

    const { container } = render(
      createElement(CopyPasswordBtn, { item, more: false, setMore: () => {} })
    );

    const button = container.querySelector('button');

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('title')).toBe('this_tab_copy_password');
    expect(container.firstChild.hasAttribute('data-tooltip')).toBe(false);
  });
});
