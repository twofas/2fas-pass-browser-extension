// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Integration spec: autofill() must fill only the current/old password field, never the new
// or confirm password fields on registration and change-password forms. Detection and
// cross-domain permission are stubbed so the test isolates the fill decision; the real
// password classifier runs against a real jsdom DOM.

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

beforeAll(() => {
  if (typeof globalThis.CSS === 'undefined' || typeof globalThis.CSS.escape !== 'function') {
    globalThis.CSS = globalThis.CSS || {};
    globalThis.CSS.escape = value => String(value).replace(/[^a-zA-Z0-9_-]/g, char => `\\${char}`);
  }
});

const inputSetValueMock = vi.fn();
const getLoginInputsMock = vi.fn();

vi.mock('./autofillFunctions/inputSetValue', () => ({ default: (...args) => inputSetValueMock(...args) }));
vi.mock('./autofillFunctions/getLoginInputs', () => ({ default: (...args) => getLoginInputsMock(...args) }));
vi.mock('./autofillFunctions/checkCrossDomainFramePermission', () => ({ default: () => ({ allowed: true }) }));
vi.mock('@/partials/inputFunctions/setUsernameSkips', () => ({ default: () => {} }));

import { AUTOFILL_RESULT_CODES } from '@/constants';
import autofill from './autofill';

const setLoginInputsFromDom = () => {
  const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
  const usernameInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"]'));
  const passwordForms = passwordInputs.map(input => input.closest('form')).filter(Boolean);

  getLoginInputsMock.mockReturnValue({ passwordInputs, passwordForms, usernameInputs });
};

const filledNames = () => inputSetValueMock.mock.calls.map(call => call[0].name);
const passwordFillNames = () => inputSetValueMock.mock.calls.filter(call => call[0].type === 'password').map(call => call[0].name);

describe('autofill password targeting', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    inputSetValueMock.mockClear();
    getLoginInputsMock.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('fills the password on a standard login form', async () => {
    document.body.innerHTML = '<form><input type="text" name="username" /><input type="password" name="password" /></form>';
    setLoginInputsFromDom();

    const result = await autofill({ username: 'user', password: 'secret', cryptoAvailable: false, iframePermissionGranted: true });

    expect(result.status).toBe('ok');
    expect(passwordFillNames()).toEqual(['password']);
  });

  it('fills only the old password on a change-password form, never the new/confirm fields', async () => {
    document.body.innerHTML = `
      <form>
        <input type="password" name="oldPassword" />
        <input type="password" name="newPassword" />
        <input type="password" name="confirmPassword" />
      </form>
    `;
    setLoginInputsFromDom();

    const result = await autofill({ password: 'secret', noUsername: true, cryptoAvailable: false, iframePermissionGranted: true });

    expect(result.status).toBe('ok');
    expect(passwordFillNames()).toEqual(['oldPassword']);
  });

  it('does not fill any password on a registration form', async () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="username" />
        <input type="password" name="p1" autocomplete="new-password" />
        <input type="password" name="p2" autocomplete="new-password" />
      </form>
    `;
    setLoginInputsFromDom();

    const result = await autofill({ username: 'user', password: 'secret', cryptoAvailable: false, iframePermissionGranted: true });

    const passwordFills = inputSetValueMock.mock.calls.filter(call => call[0].type === 'password');

    expect(passwordFills).toHaveLength(0);
    expect(filledNames()).toContain('username');
    expect(result.status).toBe('ok');
    // Capability reporting must still reflect ALL detected password fields, not the fillable subset.
    expect(result.canAutofillPassword).toBe(true);
  });

  it('fills a lone new-password field with no username (autocomplete no longer skips it)', async () => {
    document.body.innerHTML = '<input type="password" name="password" autocomplete="new-password" />';
    setLoginInputsFromDom();

    const result = await autofill({ password: 'secret', noUsername: true, cryptoAvailable: false, iframePermissionGranted: true });

    expect(result.status).toBe('ok');
    expect(passwordFillNames()).toEqual(['password']);
  });

  it('reports no input fields when every password field is a new/confirm pair (username-less reset form)', async () => {
    document.body.innerHTML = `
      <form>
        <input type="password" name="p1" autocomplete="new-password" />
        <input type="password" name="p2" autocomplete="new-password" />
      </form>
    `;
    setLoginInputsFromDom();

    const result = await autofill({ password: 'secret', noUsername: true, cryptoAvailable: false, iframePermissionGranted: true });

    expect(result.code).toBe(AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS);
    expect(inputSetValueMock).not.toHaveBeenCalled();
  });
});
