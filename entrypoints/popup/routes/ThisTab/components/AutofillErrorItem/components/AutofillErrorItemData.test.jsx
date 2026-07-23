// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Regression coverage for issue #46: copy buttons must not copy '' to the clipboard.
//
// Each data line's copy button is wrapped in CopyTooltip; when the underlying value is
// empty the button is disabled and the always-rendered wrapper span carries the
// per-field data-tooltip explaining why. Non-empty values keep the button enabled
// (no tooltip attribute) and copy exactly as before.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { createElement } from 'react';

vi.mock('@/partials/context/I18nContext', () => {
  const getMessage = key => key;

  return {
    useI18n: () => ({ getMessage })
  };
});

// `*.svg?react` is transformed to a React component by the WXT build, but not under vitest.
vi.mock('@/assets/popup-window/copy-to-clipboard.svg?react', () => ({ default: () => createElement('svg') }));

vi.mock('@/partials/functions', () => ({
  copyValue: vi.fn().mockResolvedValue(undefined)
}));

import AutofillErrorItemData from './AutofillErrorItemData';
import { copyValue } from '@/partials/functions';

class Login {
  constructor (data) {
    Object.assign(this, data);
  }
}

const makeLoginItem = data => new Login({
  id: 'item-1',
  deviceId: 'dev-1',
  vaultId: 'vault-1',
  ...data
});

describe('AutofillErrorItemData — empty-value copy buttons (issue #46)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders disabled buttons with active tooltip wrappers when values are empty', async () => {
    const item = makeLoginItem({
      sifExists: false,
      content: { username: '' }
    });

    render(createElement(AutofillErrorItemData, { item }));

    const buttons = await screen.findAllByRole('button');

    expect(buttons).toHaveLength(2);
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
    expect(buttons[0].hasAttribute('title')).toBe(false);
    expect(buttons[0].closest('span').getAttribute('data-tooltip')).toBe('this_tab_copy_disabled_no_username');
    expect(buttons[1].closest('span').getAttribute('data-tooltip')).toBe('this_tab_copy_disabled_no_password');
  });

  it('renders enabled buttons without tooltip and copies the value when non-empty', async () => {
    const item = makeLoginItem({
      sifExists: true,
      content: { username: 'user@example.com' },
      decryptSif: async () => ({ password: 'secret123' })
    });

    render(createElement(AutofillErrorItemData, { item }));

    const buttons = await screen.findAllByRole('button');

    expect(buttons).toHaveLength(2);
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
    expect(buttons[0].getAttribute('title')).toBe('this_tab_copy_to_clipboard');
    expect(buttons[0].closest('span').hasAttribute('data-tooltip')).toBe(false);
    expect(buttons[1].closest('span').hasAttribute('data-tooltip')).toBe(false);

    await act(async () => {
      fireEvent.click(buttons[0]);
    });

    expect(copyValue).toHaveBeenCalledWith('user@example.com', 'dev-1', 'vault-1', 'item-1', 'username');
  });
});
