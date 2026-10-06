// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// The save prompt setting is available on Safari from 18.4 (the pipeline needs
// webRequest.onBeforeRequest with requestBody). Safari has no privacy API, so the
// "browser" option (privacy.services.passwordSavingEnabled) is not offered there and
// changing the setting must not touch browser.privacy.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router';

const { showToastMock } = vi.hoisted(() => ({ showToastMock: vi.fn() }));

vi.mock('@/utils/showToast.js', () => ({ default: (...args) => showToastMock(...args) }));
vi.mock('@/partials/context/I18nContext', () => ({ useI18n: () => ({ getMessage: key => key }) }));
vi.mock('@/assets/popup-window/menu-arrow.svg?react', () => ({ default: () => null }));
vi.mock('@/entrypoints/popup/components/ClearLink', () => ({ default: ({ children }) => createElement('a', null, children) }));
vi.mock('@/partials/components/AdvancedSelect', () => ({
  default: ({ options, value, onChange, isDisabled }) => createElement(
    'div',
    { 'data-testid': 'save-prompt-dropdown', 'data-options': options.map(option => option.value).join(','), 'data-disabled': String(Boolean(isDisabled)) },
    createElement('span', null, value?.label),
    ...options.map(option => createElement('button', { key: option.value, type: 'button', onClick: () => onChange(option) }, `pick-${option.value}`))
  )
}));

import SavePasswordPrompt from './SavePasswordPrompt.jsx';

const safariUA = version => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Safari/605.1.15`;

const renderPrompt = async () => {
  await act(async () => {
    render(createElement(MemoryRouter, null, createElement(SavePasswordPrompt)));
  });
};

const pick = async value => {
  await waitFor(() => expect(screen.getByTestId('save-prompt-dropdown').getAttribute('data-disabled')).toBe('false'));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: `pick-${value}` }));
  });
};

describe('SavePasswordPrompt', () => {
  let originalPrivacy;

  beforeEach(async () => {
    showToastMock.mockClear();
    originalPrivacy = browser.privacy;
    browser.runtime.sendMessage = vi.fn(async () => ({ status: 'ok' }));
    await storage.setItem('local:savePrompt', 'default');
  });

  afterEach(async () => {
    cleanup();
    browser.privacy = originalPrivacy;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    await storage.removeItem('local:savePrompt');
  });

  it('offers every option outside Safari and syncs the browser password saving', async () => {
    vi.stubEnv('BROWSER', 'chrome');
    const set = vi.fn(async () => {});
    browser.privacy = { services: { passwordSavingEnabled: { set } } };

    await renderPrompt();

    expect(screen.getByTestId('save-prompt-dropdown').getAttribute('data-options')).toBe('default,default_encrypted,browser,none');

    await pick('browser');

    await waitFor(async () => expect(await storage.getItem('local:savePrompt')).toBe('browser'));
    expect(set).toHaveBeenLastCalledWith({ value: true });
    expect(showToastMock).toHaveBeenCalledWith('notification_settings_save_success', 'success');
  });

  it('is shown on Safari 18.4 without the browser option', async () => {
    vi.stubEnv('BROWSER', 'safari');
    vi.stubGlobal('navigator', { userAgent: safariUA('18.4') });
    browser.privacy = undefined;

    await renderPrompt();

    expect(screen.getByText('settings_save_prompt_header')).toBeTruthy();
    expect(screen.getByTestId('save-prompt-dropdown').getAttribute('data-options')).toBe('default,default_encrypted,none');
  });

  it('saves the setting on Safari 18.4 without the privacy API', async () => {
    vi.stubEnv('BROWSER', 'safari');
    vi.stubGlobal('navigator', { userAgent: safariUA('18.4') });
    browser.privacy = undefined;

    await renderPrompt();
    await pick('default_encrypted');

    await waitFor(async () => expect(await storage.getItem('local:savePrompt')).toBe('default_encrypted'));
    expect(showToastMock).toHaveBeenCalledWith('notification_settings_save_success', 'success');
    expect(showToastMock).not.toHaveBeenCalledWith('error_general_setting', 'error');
  });

  it('is hidden on Safari older than 18.4', async () => {
    vi.stubEnv('BROWSER', 'safari');
    vi.stubGlobal('navigator', { userAgent: safariUA('18.3') });
    browser.privacy = undefined;

    await renderPrompt();

    expect(screen.queryByText('settings_save_prompt_header')).toBeNull();
    expect(screen.queryByTestId('save-prompt-dropdown')).toBeNull();
  });
});
