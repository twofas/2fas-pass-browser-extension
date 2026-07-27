// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { createElement } from 'react';

let mockData;
let mockInputValue;
const setData = vi.fn();
const setItem = vi.fn();

vi.mock('../../../store/popupState/usePopupState', () => ({
  default: () => ({ data: mockData, setData, setItem })
}));

vi.mock('react-final-form', () => ({
  Field: ({ children }) => children({ input: { value: mockInputValue, onChange: () => {} }, meta: {} })
}));

vi.mock('motion/react', () => ({
  motion: { div: ({ children }) => createElement('div', null, children) }
}));

vi.mock('@/partials/functions/copyValue', () => ({
  default: vi.fn()
}));

vi.mock('@/partials/sessionStorage/getItem', () => ({
  default: vi.fn()
}));

vi.mock('../functions/updateItem', () => ({
  default: vi.fn()
}));

vi.mock('@/partials/context/I18nContext', () => ({
  useI18n: () => ({ getMessage: key => key })
}));

vi.mock('@/assets/popup-window/copy-to-clipboard.svg?react', () => ({ default: () => createElement('svg') }));

import Username from './Username';
import copyValue from '@/partials/functions/copyValue';

const renderUsername = () => render(createElement(Username, { formData: { inputError: null } }));

describe('Username — copy button for empty and non-empty usernames', () => {
  beforeEach(() => {
    setData.mockClear();
    setItem.mockClear();
    copyValue.mockClear();
    mockData = {
      item: { deviceId: 'd', vaultId: 'v', id: 'i', content: { username: '' }, internalData: {} },
      usernameEditable: false,
      usernameMobile: false
    };
    mockInputValue = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('disables the copy button, activates the tooltip and never copies when the username is empty', async () => {
    const { container } = renderUsername();

    const wrapper = container.querySelector('span[data-tooltip="this_tab_copy_disabled_no_username"]');
    expect(wrapper).toBeTruthy();

    const copyButton = wrapper.querySelector('button');
    expect(copyButton.disabled).toBe(true);

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(copyValue).not.toHaveBeenCalled();
  });

  it('keeps the copy button enabled and copies the username when it is present', async () => {
    mockData.item.content.username = 'john';
    mockInputValue = 'john';

    const { container } = renderUsername();

    const copyButton = screen.getByTitle('this_tab_copy_to_clipboard');
    expect(copyButton.disabled).toBe(false);
    expect(container.querySelector('span[data-tooltip]')).toBeNull();

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(copyValue).toHaveBeenCalledWith('john', 'd', 'v', 'i', 'username');
  });
});
