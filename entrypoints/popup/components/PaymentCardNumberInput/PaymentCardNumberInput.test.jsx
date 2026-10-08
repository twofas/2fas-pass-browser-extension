// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: the card number field renders the masked input at once when the InputMask chunk is loaded
// already, and stays editable (a plain input) when the chunk fails to load.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { createElement } from 'react';

const mocks = vi.hoisted(() => ({ getLoadedInputMask: null, loadInputMask: null }));

vi.mock('@/partials/primereact/loadInputMask', () => ({
  getLoadedInputMask: () => mocks.getLoadedInputMask(),
  loadInputMask: () => mocks.loadInputMask()
}));

const stableI18n = { getMessage: key => key, lang: 'en' };

vi.mock('@/partials/context/I18nContext', () => ({ useI18n: () => stableI18n }));
vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

import PaymentCardNumberInput from './index.jsx';

const MockInputMask = ({ ref, value, onChange, id }) => createElement('input', { ref, value, onChange, id, 'data-testid': 'masked-input' });

const renderComponent = onChange => render(createElement(PaymentCardNumberInput, { value: '', onChange, id: 'card-number', securityType: 2, sifExists: true }));

describe('PaymentCardNumberInput', () => {
  beforeEach(() => {
    mocks.getLoadedInputMask = vi.fn(() => MockInputMask);
    mocks.loadInputMask = vi.fn(() => Promise.resolve(MockInputMask));
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the masked input on the first render when InputMask is loaded already', () => {
    renderComponent(() => {});

    expect(screen.getByTestId('masked-input')).toBeTruthy();
    expect(mocks.loadInputMask).not.toHaveBeenCalled();
  });

  it('keeps the field editable when the InputMask chunk fails to load', async () => {
    mocks.getLoadedInputMask = vi.fn(() => null);
    mocks.loadInputMask = vi.fn(() => Promise.reject(new Error('chunk failed')));
    const onChange = vi.fn();
    renderComponent(onChange);

    await act(async () => {});

    const input = document.getElementById('card-number');

    expect(input.disabled).toBe(false);
    fireEvent.change(input, { target: { value: '4111' } });
    expect(onChange).toHaveBeenCalled();
  });
});
