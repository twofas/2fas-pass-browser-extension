// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Issue #46: copying an empty username used to copy '' and show a success toast.
// The list copy button must be disabled (with the explanatory CopyTooltip active and
// no native title, to avoid a double tooltip in Chrome) when the item has no username,
// and keep the pre-existing behavior when a username is stored.

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';

vi.mock('@/partials/context/I18nContext', () => ({
  useI18n: () => ({ getMessage: key => key })
}));

// `*.svg?react` is transformed to a React component by the WXT build, but not under vitest.
vi.mock('@/assets/popup-window/service-username.svg?react', () => ({ default: () => createElement('svg') }));

vi.mock('../functions/handleUsername', () => ({ default: vi.fn() }));

import CopyUsernameBtn from './CopyUsernameBtn';

const baseProps = { deviceId: 'dev-1', vaultId: 'vault-1', itemId: 'item-1', more: false, setMore: () => {} };

describe('CopyUsernameBtn — empty username disables copy (issue #46)', () => {
  it('renders a disabled button without title and with the active tooltip when username is empty', () => {
    const { container } = render(createElement(CopyUsernameBtn, { ...baseProps, username: '' }));
    const wrapper = container.firstChild;
    const button = container.querySelector('button');

    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('title')).toBe(false);
    expect(wrapper.getAttribute('data-tooltip')).toBe('this_tab_copy_disabled_no_username');
  });

  it('renders a disabled button when username is undefined', () => {
    const { container } = render(createElement(CopyUsernameBtn, { ...baseProps }));
    const button = container.querySelector('button');

    expect(button.disabled).toBe(true);
    expect(container.firstChild.getAttribute('data-tooltip')).toBe('this_tab_copy_disabled_no_username');
  });

  it('renders an enabled button with the copy title and inactive tooltip when username is stored', () => {
    const { container } = render(createElement(CopyUsernameBtn, { ...baseProps, username: 'user@example.com' }));
    const wrapper = container.firstChild;
    const button = container.querySelector('button');

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('title')).toBe('this_tab_copy_username');
    expect(wrapper.hasAttribute('data-tooltip')).toBe(false);
  });
});
