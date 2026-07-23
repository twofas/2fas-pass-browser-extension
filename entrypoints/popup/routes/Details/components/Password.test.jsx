// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Regression coverage for editing a Highly Secret password after the fetched-item timeout.
//
// A Highly Secret item caches no SIF locally; fetching it from the phone provides the decrypted
// password for ~3 minutes (sifT2Reset alarm), after which item.removeSif() clears #s_password so
// sifExists becomes false. While the details view stays open the user can still click "Edit":
// decryptPasswordOnDemand() then hits the `!itemInstance?.sifExists` branch. It used to return null
// silently, so the field entered edit mode EMPTY with no feedback. It must instead raise
// sifDecryptError so the "decryption error / expired" overlay is shown — but ONLY when a SIF was
// expected (originalItem.isT3orT2WithSif), so the before-expiry Edit/Cancel/Edit flow still works.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { createElement } from 'react';

let mockData;
const setData = vi.fn();
const setBatchData = vi.fn();
const setItem = vi.fn();

vi.mock('../../../store/popupState/usePopupState', () => ({
  default: () => ({ data: mockData, setData, setBatchData, setItem })
}));

// Mock the model so we control sifExists / decryptSif without crypto, key storage, or i18n.
vi.mock('@/models/itemModels/Login', () => {
  class MockLogin {
    constructor (data = {}) {
      Object.assign(this, data);
    }

    get sifExists () {
      return !!this.__sifExists;
    }

    get isT3orT2WithSif () {
      return !!this.__isT3orT2WithSif;
    }

    decryptSif () {
      return Promise.resolve({ password: this.__decrypted ?? '' });
    }
  }

  return { default: MockLogin };
});

vi.mock('react-final-form', () => ({
  Field: ({ children }) => children({ input: {}, meta: {} })
}));

vi.mock('motion/react', () => ({
  motion: { div: ({ children }) => createElement('div', null, children) }
}));

vi.mock('@/partials/functions', () => ({
  isText: v => typeof v === 'string' && v.length > 0,
  copyValue: vi.fn()
}));

vi.mock('../functions/checkPasswordChangeSupport', () => ({
  findPasswordChangeUrl: vi.fn().mockResolvedValue(null)
}));

vi.mock('@/partials/context/I18nContext', () => ({
  useI18n: () => ({ getMessage: key => key })
}));

vi.mock('@/entrypoints/popup/components/ClearLink', () => ({
  default: ({ children }) => createElement('span', null, children)
}));

vi.mock('@/assets/popup-window/visible.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/assets/popup-window/info.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/assets/popup-window/copy-to-clipboard.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/assets/popup-window/refresh.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/assets/popup-window/new-tab.svg?react', () => ({ default: () => createElement('svg') }));

import Password from './Password';
import Login from '@/models/itemModels/Login';
import { copyValue } from '@/partials/functions';

const makeOriginal = (overrides = {}) => ({
  securityType: SECURITY_TIER.HIGHLY_SECRET,
  sifExists: true,
  isT3orT2WithSif: true,
  ...overrides
});

const renderPassword = ({ originalItem, sifDecryptError = false }) => {
  const form = { change: vi.fn(), getState: () => ({ values: {} }) };
  return render(createElement(Password, { sifDecryptError, formData: { form, originalItem } }));
};

describe('Password — editing a Highly Secret item after the fetched SIF expired', () => {
  beforeEach(() => {
    setData.mockClear();
    setBatchData.mockClear();
    setItem.mockClear();
    mockData = { item: null, passwordEditable: false, passwordVisible: false, passwordMobile: false };
  });

  afterEach(() => {
    cleanup();
  });

  it('raises sifDecryptError when clicking Edit and the SIF is gone (so the error overlay can show)', async () => {
    mockData.item = new Login({ deviceId: 'd', vaultId: 'v', id: 'i', __sifExists: false, __isT3orT2WithSif: false });

    renderPassword({ originalItem: makeOriginal({ sifExists: false }) });

    await act(async () => {
      fireEvent.click(screen.getByText('edit'));
    });

    expect(setData).toHaveBeenCalledWith('sifDecryptError', true);
  });

  it('does NOT raise sifDecryptError when the SIF is still available (Edit/Cancel/Edit before timeout)', async () => {
    const item = new Login({ deviceId: 'd', vaultId: 'v', id: 'i', __sifExists: true, __isT3orT2WithSif: true, __decrypted: 'hunter2' });
    mockData.item = item;

    renderPassword({ originalItem: makeOriginal() });

    await act(async () => {
      fireEvent.click(screen.getByText('edit'));
    });

    expect(setData).not.toHaveBeenCalledWith('sifDecryptError', true);
    expect(setData).toHaveBeenCalledWith('sifDecryptError', false);
  });

  it('renders the decryption-error overlay while sifDecryptError is set', () => {
    mockData.item = new Login({ deviceId: 'd', vaultId: 'v', id: 'i', __sifExists: false, __isT3orT2WithSif: false });

    renderPassword({ originalItem: makeOriginal({ sifExists: false }), sifDecryptError: true });

    expect(screen.getByText('details_password_decrypt_error')).toBeTruthy();
  });
});

describe('Password — copy button for a SECRET item without stored SIF', () => {
  beforeEach(() => {
    setData.mockClear();
    setBatchData.mockClear();
    setItem.mockClear();
    copyValue.mockClear();
    mockData = { item: null, passwordEditable: false, passwordVisible: false, passwordMobile: false };
  });

  afterEach(() => {
    cleanup();
  });

  it('disables the copy button, activates the tooltip and never copies when the SIF is empty', async () => {
    mockData.item = new Login({ deviceId: 'd', vaultId: 'v', id: 'i', __sifExists: false, __isT3orT2WithSif: true });

    const { container } = renderPassword({ originalItem: makeOriginal({ securityType: SECURITY_TIER.SECRET, sifExists: false }) });

    const wrapper = container.querySelector('span[data-tooltip="this_tab_copy_disabled_no_password"]');
    expect(wrapper).toBeTruthy();

    const copyButton = wrapper.querySelector('button');
    expect(copyButton.disabled).toBe(true);

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(copyValue).not.toHaveBeenCalled();
  });

  it('keeps the copy button enabled without an active tooltip when the SIF exists', () => {
    mockData.item = new Login({ deviceId: 'd', vaultId: 'v', id: 'i', __sifExists: true, __isT3orT2WithSif: true, __decrypted: 'hunter2' });

    const { container } = renderPassword({ originalItem: makeOriginal({ securityType: SECURITY_TIER.SECRET }) });

    const copyButton = screen.getByTitle('this_tab_copy_to_clipboard');
    expect(copyButton.disabled).toBe(false);
    expect(container.querySelector('span[data-tooltip]')).toBeNull();
  });
});
