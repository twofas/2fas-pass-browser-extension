// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';

const { getMessage, Svg } = vi.hoisted(() => ({
  getMessage: key => key,
  Svg: () => null
}));

vi.mock('@/partials/context/I18nContext', () => ({ useI18n: () => ({ getMessage }) }));
vi.mock('../functions/getRatingLink', () => ({ default: () => 'https://example.com/rate' }));
vi.mock('../functions/getRatingText', () => ({ default: () => 'rate' }));
vi.mock('@/entrypoints/popup/hooks/useScrollPosition', () => ({ default: () => {} }));
vi.mock('@/entrypoints/popup/components/NavigationButton', () => ({ default: () => createElement('div') }));
vi.mock('@/entrypoints/popup/components/ClearLink', () => ({ default: ({ children, className }) => createElement('a', { className }, children) }));
vi.mock('@/assets/popup-window/star.svg?react', () => ({ default: Svg }));
vi.mock('@/assets/popup-window/about.svg?react', () => ({ default: Svg }));
vi.mock('@/assets/popup-window/about-dark.svg?react', () => ({ default: Svg }));
vi.mock('@/assets/popup-window/domain.svg?react', () => ({ default: Svg }));
vi.mock('@/assets/popup-window/menu-arrow.svg?react', () => ({ default: Svg }));
vi.mock('@/assets/social/discord.svg?react', () => ({ default: Svg }));
vi.mock('@/assets/social/youtube.svg?react', () => ({ default: Svg }));
vi.mock('@/assets/social/twitter.svg?react', () => ({ default: Svg }));
vi.mock('@/assets/social/github.svg?react', () => ({ default: Svg }));

import SettingsAbout from './index.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SettingsAbout', () => {
  it('opens the open source licenses page in a new tab', async () => {
    const create = vi.spyOn(browser.tabs, 'create').mockResolvedValue({ id: 1 });
    vi.spyOn(browser.runtime, 'getManifest').mockReturnValue({ version: '1.8.14' });

    render(createElement(SettingsAbout, {}));

    const link = screen.getByText('settings_licenses_menu_link').closest('a');

    await act(async () => {
      fireEvent.click(link);
    });

    expect(create).toHaveBeenCalledWith({ url: browser.runtime.getURL('/licenses.html') });
  });
});
