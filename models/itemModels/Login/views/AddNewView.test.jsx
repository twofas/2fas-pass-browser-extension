// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// The Login AddNew form used to render nothing until getDomainInfo() finished: content-script
// injection into every frame plus a GET_DOMAIN_INFO fan-out, all for hidden password-rule
// fields. On meet.google.com that kept the view blank for ~380 ms and more. The form must show
// at once; the tab URL and the page's password rules arrive in the background.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { createElement, useLayoutEffect, useSyncExternalStore } from 'react';
import { MemoryRouter } from 'react-router';

let storeData;
const storeListeners = new Set();
const setData = vi.fn((key, value) => {
  storeData = { ...storeData, [key]: value };
  storeListeners.forEach(listener => listener());
});

/**
* Subscribes a listener to the test store.
* @param {Function} listener - Called after every store change.
* @return {Function} Unsubscribe function.
*/
const subscribeStore = listener => {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
};

vi.mock('@/entrypoints/popup/store/popupState/usePopupState', () => ({
  default: () => ({ data: useSyncExternalStore(subscribeStore, () => storeData), setData })
}));

const getMessage = key => key;

vi.mock('@/partials/context/I18nContext', () => ({
  useI18n: () => ({ getMessage })
}));

vi.mock('@/utils/getMessage.js', () => ({
  getMessage: key => key,
  initI18n: vi.fn(),
  resetI18nCache: vi.fn(),
  getI18nState: vi.fn()
}));

vi.mock('motion/react-m', () => ({
  div: ({ children }) => createElement('div', null, children)
}));

vi.mock('@/assets/popup-window/visible.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/assets/popup-window/copy-to-clipboard.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/assets/popup-window/refresh.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/assets/popup-window/learn-more.svg?react', () => ({ default: () => createElement('svg') }));

vi.mock('@/partials/functions/getLastActiveTab', () => ({ default: vi.fn() }));
vi.mock('@/entrypoints/popup/routes/AddNew/functions/getDomainInfo', () => ({ default: vi.fn() }));

import LoginAddNewView from './AddNewView';
import getLastActiveTab from '@/partials/functions/getLastActiveTab';
import getDomainInfo from '@/entrypoints/popup/routes/AddNew/functions/getDomainInfo';

const TAB = { id: 42, url: 'https://meet.google.com/' };

/**
* Creates a promise resolved from the outside.
* @return {Object} The promise and its resolve function.
*/
const deferred = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};

/**
* Renders the Login AddNew view inside a router.
* @return {Object} The render result.
*/
const renderView = () => render(createElement(MemoryRouter, { initialEntries: ['/add-new/Login'] }, createElement(LoginAddNewView)));

const urlInput = () => document.getElementById('add-new-url');

describe('LoginAddNewView — page data does not block the form', () => {
  beforeEach(() => {
    storeData = {};
    setData.mockClear();
    getLastActiveTab.mockReset();
    getDomainInfo.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the form while the page is still being read', async () => {
    getLastActiveTab.mockReturnValue(new Promise(() => {}));
    getDomainInfo.mockReturnValue(new Promise(() => {}));

    renderView();

    expect(await screen.findByText('add_new_header_login')).toBeTruthy();
    expect(urlInput()).toBeTruthy();
    expect(screen.getByRole('button', { name: 'continue' })).toBeTruthy();
  });

  it('never paints the "set in the mobile app" toggle unchecked before its default is applied', async () => {
    const firstCommit = {};

    /**
    * Reads the toggle in the first commit, before the browser could paint it.
    * @return {null} Renders nothing.
    */
    const FirstCommitProbe = () => {
      useLayoutEffect(function readToggleOnFirstCommit() {
        const toggle = document.getElementById('set-in-mobile');
        firstCommit.toggle = toggle ? toggle.checked : 'absent';
      }, []);

      return null;
    };

    getLastActiveTab.mockReturnValue(new Promise(() => {}));
    getDomainInfo.mockReturnValue(new Promise(() => {}));

    render(createElement(MemoryRouter, { initialEntries: ['/add-new/Login'] }, createElement(LoginAddNewView), createElement(FirstCommitProbe)));

    expect(firstCommit.toggle).not.toBe(false);
    expect((await screen.findByRole('checkbox')).checked).toBe(true);
  });

  it('fills the URL from the active tab without waiting for the password rules', async () => {
    getLastActiveTab.mockResolvedValue(TAB);
    getDomainInfo.mockReturnValue(new Promise(() => {}));

    renderView();

    await waitFor(() => expect(urlInput()?.value).toBe(TAB.url));
  });

  it('keeps a URL typed before the tab was read', async () => {
    const tab = deferred();
    getLastActiveTab.mockReturnValue(tab.promise);
    getDomainInfo.mockReturnValue(new Promise(() => {}));

    renderView();

    fireEvent.change(await screen.findByPlaceholderText('placeholder_domain_uri'), { target: { value: 'https://typed.example/' } });

    await act(async () => {
      tab.resolve(TAB);
    });

    expect(urlInput().value).toBe('https://typed.example/');
    expect(storeData.url).toBe('https://typed.example/');
  });

  it('keeps the URL restored from the store', async () => {
    storeData = { url: 'https://saved.example/' };
    getLastActiveTab.mockResolvedValue(TAB);
    getDomainInfo.mockResolvedValue({ minLength: null, maxLength: null, pattern: null });

    renderView();

    await waitFor(() => expect(getDomainInfo).toHaveBeenCalled());
    expect(urlInput().value).toBe('https://saved.example/');
  });

  it('reads the password rules from the active tab and stores them', async () => {
    getLastActiveTab.mockResolvedValue(TAB);
    getDomainInfo.mockResolvedValue({ minLength: '8', maxLength: '64', pattern: '[a-z]+' });

    renderView();

    await waitFor(() => expect(storeData.pattern).toBe('[a-z]+'));
    expect(getDomainInfo).toHaveBeenCalledWith(TAB);
    expect(storeData.minLength).toBe('8');
    expect(storeData.maxLength).toBe('64');
  });

  it('ignores page data that arrives after the view is closed', async () => {
    const tab = deferred();
    getLastActiveTab.mockReturnValue(tab.promise);
    getDomainInfo.mockResolvedValue({ minLength: '8', maxLength: null, pattern: null });

    const { unmount } = renderView();
    await screen.findByText('add_new_header_login');
    unmount();
    setData.mockClear();

    await act(async () => {
      tab.resolve(TAB);
    });

    expect(setData).not.toHaveBeenCalled();
    expect(getDomainInfo).not.toHaveBeenCalled();
  });
});
