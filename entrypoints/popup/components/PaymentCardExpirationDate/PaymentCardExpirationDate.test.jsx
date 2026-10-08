// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: PrimeReact is loaded only where it is needed. The masked input loads the InputMask chunk
// (shared with the card number and security code inputs) and renders it at once when another field has loaded
// it already. The calendar chunk is loaded only on intent — the pointer entering the calendar button — and a
// click that comes before it is ready opens the calendar as soon as it has loaded.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { createElement, useImperativeHandle } from 'react';

const mocks = vi.hoisted(() => ({
  getLoadedInputMask: null,
  loadInputMask: null,
  getLoadedCalendar: null,
  loadCalendar: null,
  applyCalendarLocale: null,
  show: null
}));

vi.mock('@/partials/primereact/loadInputMask', () => ({
  getLoadedInputMask: () => mocks.getLoadedInputMask(),
  loadInputMask: () => mocks.loadInputMask()
}));
vi.mock('@/partials/primereact/loadCalendar', () => ({
  getLoadedCalendar: () => mocks.getLoadedCalendar(),
  loadCalendar: () => mocks.loadCalendar(),
  applyCalendarLocale: getMessage => mocks.applyCalendarLocale(getMessage)
}));

const stableI18n = { getMessage: key => key, lang: 'en' };
const polishI18n = { getMessage: key => `pl:${key}`, lang: 'pl' };
const i18n = { current: stableI18n };

vi.mock('@/partials/context/I18nContext', () => ({ useI18n: () => i18n.current }));
vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('@/assets/popup-window/calendar.svg?react', () => ({ default: () => createElement('svg') }));

import PaymentCardExpirationDate from './index.jsx';

const MockInputMask = ({ ref, value, onChange, id, disabled, placeholder }) =>
  createElement('input', { ref, value, onChange, id, disabled, placeholder, 'data-testid': 'masked-input' });

const MockCalendar = ({ ref, onShow, onHide }) => {
  useImperativeHandle(ref, () => ({
    show: () => {
      mocks.show();
      onShow();
    },
    hide: () => onHide(),
    overlayRef: { current: null }
  }));

  return createElement('div', { 'data-testid': 'calendar' });
};

const renderComponent = () => render(createElement(PaymentCardExpirationDate, {
  value: '',
  onChange: () => {},
  inputId: 'expiration',
  disabled: false,
  securityType: 2,
  sifExists: true
}));

describe('PaymentCardExpirationDate', () => {
  beforeEach(() => {
    mocks.getLoadedInputMask = vi.fn(() => MockInputMask);
    mocks.loadInputMask = vi.fn(() => Promise.resolve(MockInputMask));
    mocks.getLoadedCalendar = vi.fn(() => null);
    mocks.loadCalendar = vi.fn(() => Promise.resolve(MockCalendar));
    mocks.applyCalendarLocale = vi.fn();
    mocks.show = vi.fn();
  });

  afterEach(() => {
    cleanup();
    i18n.current = stableI18n;
  });

  it('does not load the calendar when it renders', () => {
    renderComponent();

    expect(mocks.loadCalendar).not.toHaveBeenCalled();
    expect(screen.queryByTestId('calendar')).toBeNull();
  });

  it('starts loading the calendar when the pointer enters the calendar button', async () => {
    renderComponent();

    await act(async () => {
      fireEvent.pointerEnter(screen.getByTitle('button_open_calendar'));
    });

    expect(mocks.loadCalendar).toHaveBeenCalled();
    expect(mocks.applyCalendarLocale).toHaveBeenCalledWith(stableI18n.getMessage);
    expect(screen.getByTestId('calendar')).toBeTruthy();
    expect(mocks.show).not.toHaveBeenCalled();
  });

  it('opens the calendar as soon as it has loaded when the button is clicked first', async () => {
    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTitle('button_open_calendar'));
    });

    expect(mocks.show).toHaveBeenCalledTimes(1);
  });

  it('opens an already loaded calendar on click without loading it again', async () => {
    mocks.getLoadedCalendar = vi.fn(() => MockCalendar);
    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTitle('button_open_calendar'));
    });

    expect(mocks.loadCalendar).not.toHaveBeenCalled();
    expect(mocks.show).toHaveBeenCalledTimes(1);
  });

  it('renders the masked input on the first render when InputMask is loaded already', () => {
    renderComponent();

    expect(screen.getByTestId('masked-input')).toBeTruthy();
    expect(mocks.loadInputMask).not.toHaveBeenCalled();
  });

  it('renders a disabled plain input until the InputMask chunk has loaded', async () => {
    mocks.getLoadedInputMask = vi.fn(() => null);
    renderComponent();

    expect(screen.queryByTestId('masked-input')).toBeNull();
    expect(document.getElementById('expiration').disabled).toBe(true);

    await act(async () => {});

    expect(screen.getByTestId('masked-input')).toBeTruthy();
  });

  it('keeps the field editable when the InputMask chunk fails to load', async () => {
    mocks.getLoadedInputMask = vi.fn(() => null);
    mocks.loadInputMask = vi.fn(() => Promise.reject(new Error('chunk failed')));
    const onChange = vi.fn();
    render(createElement(PaymentCardExpirationDate, { value: '', onChange, inputId: 'expiration', disabled: false, securityType: 2, sifExists: true }));

    await act(async () => {});

    const input = document.getElementById('expiration');

    expect(input.disabled).toBe(false);
    fireEvent.change(input, { target: { value: '12/30' } });
    expect(onChange).toHaveBeenCalledWith('12/30');
  });

  it('re-applies the calendar locale when the language changes', async () => {
    mocks.getLoadedCalendar = vi.fn(() => MockCalendar);
    const view = renderComponent();

    i18n.current = polishI18n;
    view.rerender(createElement(PaymentCardExpirationDate, { value: '', onChange: () => {}, inputId: 'expiration', disabled: false, securityType: 2, sifExists: true }));

    expect(mocks.applyCalendarLocale).toHaveBeenLastCalledWith(polishI18n.getMessage);
  });
});
